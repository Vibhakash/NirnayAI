import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    sys.stdout.reconfigure(encoding='utf-8')
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client[os.getenv("DB_NAME", "nirnayai")]
    
    verdicts = await db.verdicts.find().sort('_id', -1).to_list(100)
    print("VERDICTS in DB:")
    for v in verdicts:
        print(f"Bidder: {v.get('bidder_name')}, Crit: {v.get('criterion_description')[:50]}..., Verdict: {v.get('verdict')}")
        print(f"Reason: {v.get('reasoning')}")

asyncio.run(main())
