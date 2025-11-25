import discord
import asyncio

class ActivationError(Exception):
    pass

async def activate_discord_engine(bot_token: str, guild_id: str):
    """
    Activates the engine in a Discord server.
    - Checks bot token and guild access.
    - Creates a private channel for logs.
    - Sends a confirmation message.
    """
    intents = discord.Intents.default()
    intents.guilds = True
    intents.messages = True
    
    client = discord.Client(intents=intents)

    try:
        # We need to wrap the login and connection logic in a future
        # as client.start() is a blocking call that runs a whole event loop.
        # We just want to perform a few actions and then disconnect.
        
        @client.event
        async def on_ready():
            print(f'Logged in as {client.user}')
            
            try:
                guild = client.get_guild(int(guild_id))
                if not guild:
                    raise ActivationError(f"Bot cannot access Guild ID: {guild_id}. Make sure the bot is in the server.")

                # Check for existing channel
                log_channel_name = "lead-engine-logs"
                log_channel = discord.utils.get(guild.text_channels, name=log_channel_name)

                if not log_channel:
                    print(f"Creating new channel: {log_channel_name}")
                    # Make channel private to @everyone
                    overwrites = {
                        guild.default_role: discord.PermissionOverwrite(read_messages=False),
                        guild.me: discord.PermissionOverwrite(read_messages=True)
                    }
                    log_channel = await guild.create_text_channel(log_channel_name, overwrites=overwrites)
                    await log_channel.send("✅ **Lead Engine Log Channel Created**")
                
                await log_channel.send("🚀 **Growth Engine Activated!** The bot is now live and listening for events.")
                
            except Exception as e:
                # Propagate exceptions to the outer scope
                client.loop.stop()
                raise ActivationError(f"Failed during activation: {e}") from e
            finally:
                # Stop the client loop so the function can return
                await client.close()

        # Run the client with a timeout
        await asyncio.wait_for(client.start(bot_token), timeout=15.0)
        
        return {"status": "success", "message": "Engine activated successfully in Discord."}

    except asyncio.TimeoutError:
        raise ActivationError("Activation timed out. The bot token might be invalid or the Discord API is slow.")
    except Exception as e:
        # This will catch login failures and other exceptions
        raise ActivationError(f"An error occurred during Discord activation: {e}")

