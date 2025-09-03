
## CRITICAL DynamoDB GSI Setup

1. Go to AWS Console > DynamoDB > stj_subscribers table
2. Click 'Indexes' tab > 'Create Index'
3. Partition key: username (String)
4. Index name: username-index  
5. Projected attributes: Keys only
6. Click 'Create Index'

This will solve your biggest scalability bottleneck!

