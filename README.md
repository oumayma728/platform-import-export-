## API Documentation

The backend API is documented using OpenAPI 3 and Swagger.

### Swagger UI

Start the Spring Boot application and open:

http://localhost:8080/docs

### ReDoc

http://localhost:8080/redoc

### OpenAPI specification

http://localhost:8080/openapi.json

A static exported specification is also available at:

docs/openapi.json


## Authentication

Protected endpoints use JWT Bearer authentication.

Header:

Authorization: Bearer <access_token>

Swagger UI provides an `Authorize` button allowing the JWT
access token to be used when testing secured endpoints.


## Postman Collection

The Postman files are located in:

docs/postman/

Files:

- Pont-Commercial.postman_collection.json
- Local.postman_environment.json
- Staging.postman_environment.json


### Running locally

1. Import the Postman collection.
2. Import `Local.postman_environment.json`.
3. Select the `Pont Commercial - Local` environment.
4. Execute `/auth/login`.
5. The access token is automatically stored in `accessToken`.
6. Secured endpoints use `Bearer {{accessToken}}`.


## Environments

Local:

baseUrl=http://localhost:8080

Staging:

Configure the `baseUrl` variable with the staging backend URL.


## Main API Modules

- Authentication
- Users
- Companies
- Listings
- Categories
- Conversations
- Messages
- Documents
- Roles
- Incoterms
- Subscriptions
- Usage payments
- Stripe payments
- Billing
- Notifications
- Currency conversion
- Logistics estimation