from backend.models.lead import Lead, MessageFlow
from backend.models.workspace import Workspace
from sqlalchemy.orm import Session
import discord

async def send_welcome_dm(db: Session, lead: Lead):
    """
    Sends a welcome DM to a newly discovered lead.
    """
    print(f"Attempting to send welcome DM to lead {lead.id} ({lead.author})")

    # 1. Get the user's workspace and message flow
    workspace = db.query(Workspace).filter(Workspace.creator_id == lead.user_id).first()
    if not workspace:
        print(f"No workspace found for user {lead.user_id}. Cannot send DM.")
        return

    # For now, let's try to find any message flow.
    # Later, this can be assigned specifically.
    message_flow = db.query(MessageFlow).filter(MessageFlow.creator_id == lead.user_id).first()
    if not message_flow or not message_flow.welcome_message:
        print(f"No message flow with a welcome message found for user {lead.user_id}.")
        return

    # 2. Personalize the message
    message_content = message_flow.welcome_message.replace("{{user}}", lead.author)
    
    # Construct checkout link
    # In a real app, the base URL should come from config
    frontend_base_url = "http://localhost:3000" 
    checkout_link = f"{frontend_base_url}/checkout?attribution_id={lead.attribution_id}"
    message_content = message_content.replace("{{checkout_link}}", checkout_link)

    # 3. Send the message via the correct platform
    if workspace.workspace_type == "discord":
        await send_discord_dm(
            bot_token=workspace.bot_token,
            recipient_username=lead.author,
            message=message_content
        )
    else:
        print(f"Workspace type '{workspace.workspace_type}' not yet supported for DMs.")


async def send_discord_dm(bot_token: str, recipient_username: str, message: str):
    """
    Uses the bot to send a DM to a user on Discord.
    Note: This is a simplified implementation. A real bot would need to
    share a server with the user to send a DM without a friend request.
    This function assumes the bot can find the user.
    """
    intents = discord.Intents.default()
    intents.members = True # Required to find users
    client = discord.Client(intents=intents)

    @client.event
    async def on_ready():
        print(f'DM Bot logged in as {client.user}')
        try:
            # This is a big assumption: that the bot can find the user by name.
            # In a real-world scenario, you'd likely need the user's Discord ID.
            user = discord.utils.find(lambda u: str(u) == recipient_username, client.users)

            # A more reliable way is to iterate through guilds the bot is in
            if not user:
                for guild in client.guilds:
                    member = guild.get_member_named(recipient_username)
                    if member:
                        user = member
                        break
            
            if user:
                print(f"Found user {user}. Sending DM...")
                await user.send(message)
                print("DM sent successfully.")
            else:
                print(f"Could not find user '{recipient_username}' in any shared servers.")

        except Exception as e:
            print(f"Failed to send DM: {e}")
        finally:
            await client.close()

    try:
        await client.start(bot_token)
    except Exception as e:
        print(f"Failed to start DM bot: {e}")

