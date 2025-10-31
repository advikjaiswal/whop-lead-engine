import openai
from typing import Dict, List, Any, Optional
import json
from loguru import logger
from config.settings import get_settings

settings = get_settings()


class AIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4"  # or gpt-3.5-turbo for cost savings
    
    async def analyze_lead(self, lead) -> Dict[str, Any]:
        """Analyze a lead and return intent score, quality grade, and insights"""
        
        try:
            # Build context about the lead
            context = self._build_lead_context(lead)
            
            prompt = f"""
            Analyze this potential lead for a paid community/membership business:
            
            {context}
            
            Please provide your analysis in JSON format with these fields:
            {{
                "intent_score": float (0.0 to 1.0, where 1.0 is highest intent),
                "quality_grade": string ("A", "B", "C", or "D"),
                "interests": [list of relevant interests/topics],
                "pain_points": [list of potential pain points this person might have],
                "summary": "brief summary of why this is a good/bad lead",
                "personalization_data": {{
                    "recommended_approach": "how to approach this lead",
                    "key_talking_points": [list of topics to mention],
                    "urgency_level": "low/medium/high"
                }}
            }}
            
            Base your analysis on:
            - Language patterns indicating interest in learning/communities
            - Expressed frustrations or needs
            - Activity level and engagement
            - Professional background or interests
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing potential leads for online communities and membership businesses. Provide accurate, actionable insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )
            
            # Parse JSON response
            analysis_text = response.choices[0].message.content
            analysis = json.loads(analysis_text)
            
            # Validate and clean the response
            analysis = self._validate_analysis(analysis)
            
            logger.info(f"Successfully analyzed lead {lead.id}")
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze lead {lead.id}: {e}")
            # Return default analysis
            return {
                "intent_score": 0.5,
                "quality_grade": "C",
                "interests": [],
                "pain_points": [],
                "summary": "Analysis failed - manual review needed",
                "personalization_data": {
                    "recommended_approach": "Generic outreach",
                    "key_talking_points": [],
                    "urgency_level": "low"
                }
            }
    
    async def personalize_message(self, template: str, lead_data: Dict[str, Any]) -> str:
        """Generate personalized outreach message"""
        
        try:
            prompt = f"""
            Personalize this outreach message template for a specific lead:
            
            Template: {template}
            
            Lead Information:
            - Name: {lead_data.get('name', 'there')}
            - Username: {lead_data.get('username', '')}
            - Interests: {', '.join(lead_data.get('interests', []))}
            - Pain Points: {', '.join(lead_data.get('pain_points', []))}
            - Recommended Approach: {lead_data.get('recommended_approach', '')}
            - Key Talking Points: {', '.join(lead_data.get('key_talking_points', []))}
            
            Requirements:
            1. Keep the core message and call-to-action from the template
            2. Add personal touches based on the lead's interests and pain points
            3. Use a friendly, non-salesy tone
            4. Keep it concise (under 200 words)
            5. Include specific value propositions that match their interests
            
            Return only the personalized message, no explanations.
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert copywriter specializing in personalized outreach for online communities."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            personalized_message = response.choices[0].message.content.strip()
            
            logger.info("Successfully personalized outreach message")
            return personalized_message
            
        except Exception as e:
            logger.error(f"Failed to personalize message: {e}")
            # Return template with basic personalization
            return template.replace("[NAME]", lead_data.get('name', 'there'))
    
    async def generate_retention_message(self, member_data: Dict[str, Any], community_name: str) -> str:
        """Generate retention message for at-risk members"""
        
        try:
            prompt = f"""
            Generate a personalized retention message for a member who hasn't been active in the community:
            
            Member Information:
            - Name: {member_data.get('name', 'there')}
            - Days Inactive: {member_data.get('days_inactive', 'several')}
            - Tier: {member_data.get('tier', 'member')}
            - Message Type: {member_data.get('message_type', 'reminder')}
            
            Community: {community_name or 'our community'}
            
            Requirements:
            1. Friendly and understanding tone
            2. Acknowledge their absence without being pushy
            3. Highlight value they might be missing
            4. Include a clear, low-pressure call to action
            5. Keep it under 150 words
            
            Message types:
            - reminder: Gentle reminder about community value
            - coupon: Include mention of special offer (don't specify amount)
            - personal_check_in: More personal, ask how they're doing
            
            Return only the message content, no subject line.
            """
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at crafting empathetic retention messages for online communities."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=250
            )
            
            retention_message = response.choices[0].message.content.strip()
            
            logger.info("Successfully generated retention message")
            return retention_message
            
        except Exception as e:
            logger.error(f"Failed to generate retention message: {e}")
            # Return default message
            return f"Hi {member_data.get('name', 'there')}! We've missed you in {community_name or 'our community'}. There's been some great content shared recently that I think you'd find valuable. Hope to see you back soon!"
    
    def _build_lead_context(self, lead) -> str:
        """Build context string for lead analysis"""
        context_parts = []
        
        if lead.name:
            context_parts.append(f"Name: {lead.name}")
        if lead.username:
            context_parts.append(f"Username: {lead.username}")
        if lead.source:
            context_parts.append(f"Source: {lead.source.value}")
        if lead.profile_url:
            context_parts.append(f"Profile: {lead.profile_url}")
        
        # TODO: Add more context from scraped profile data
        # This could include recent posts, bio, activity patterns, etc.
        
        return "\n".join(context_parts) if context_parts else "Limited information available"
    
    def _validate_analysis(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean AI analysis response"""
        
        # Ensure intent_score is between 0 and 1
        if 'intent_score' in analysis:
            analysis['intent_score'] = max(0.0, min(1.0, float(analysis['intent_score'])))
        else:
            analysis['intent_score'] = 0.5
        
        # Ensure quality_grade is valid
        valid_grades = ['A', 'B', 'C', 'D']
        if 'quality_grade' not in analysis or analysis['quality_grade'] not in valid_grades:
            analysis['quality_grade'] = 'C'
        
        # Ensure lists exist
        for field in ['interests', 'pain_points']:
            if field not in analysis or not isinstance(analysis[field], list):
                analysis[field] = []
        
        # Ensure summary exists
        if 'summary' not in analysis:
            analysis['summary'] = "Analysis completed"
        
        # Ensure personalization_data exists
        if 'personalization_data' not in analysis:
            analysis['personalization_data'] = {
                "recommended_approach": "Standard outreach",
                "key_talking_points": [],
                "urgency_level": "medium"
            }
        
        return analysis