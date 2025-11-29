#!/bin/bash
# Get customer_id for merijn@risotitni

aws dynamodb scan \
  --table-name stj_subscribers \
  --filter-expression "contains(#email, :email)" \
  --expression-attribute-names '{"#email":"email"}' \
  --expression-attribute-values '{":email":{"S":"merijn@risotitni"}}' \
  --projection-expression "customer_id,email,username" \
  --region eu-north-1










