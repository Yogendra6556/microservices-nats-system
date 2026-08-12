# microservices-nats-system
Markdown
# Microservices System with NATS & API Gateway

A robust, production-ready microservices architecture built with **TypeScript**, **Node.js**, **NATS JetStream**, and **Docker**.

---

##  Architecture Overview

```text
                     +---------------------------------------+
                     |              Client / UI              |
                     +---------------------------------------+
                                         |
                                         | REST / HTTP Requests
                                         v
                     +---------------------------------------+
                     |              API Gateway              |
                     |         (Port 3000 - Express)         |
                     +---------------------------------------+
                                         |
                                         | NATS Request-Reply Pattern
                                         | Topic: user.v1.create
                                         v
                     +---------------------------------------+
                     |              NATS Server              |
                     |       (Port 4222 - JetStream)         |
                     +---------------------------------------+
                        /                         \
    NATS Request-Reply /                           \ NATS JetStream Event
  `user.v1.create`    /                             \ `user.v1.created`
                     v                               v
       +----------------------------+   +----------------------------+
       |        User Service        |   |    Notification Service    |
       |    (Event Publisher)       |   |   (Event Consumer / Worker)|
       +----------------------------+   +----------------------------+
Components & Services
API Gateway (api-gateway):

Exposes RESTful HTTP endpoints for external clients.

Converts HTTP REST requests into asynchronous NATS Request-Reply messaging.

Handles client-facing validation and error mapping.

User Service (user-service):

Listens to NATS requests for user creation (user.v1.create).

Persists user records.

Publishes durable events (user.v1.created) to NATS JetStream.

Notification Service (notification-service):

Asynchronously consumes events from NATS JetStream stream USER_EVENTS.

Uses Queue Groups for horizontal scalability.

Implements explicit message acknowledgments (ack).

NATS Message Broker (nats):

Provides low-latency, event-driven inter-service communication without using direct REST APIs or WebSockets.

Security & Reliability
Inter-Service Security: Downstream services are isolated inside the internal Docker network and communicate exclusively via NATS protocol.

Reliable Messaging: NATS JetStream provides persistent, durable message storage with at-least-once delivery guarantees.

Service Decoupling: Services run asynchronously without tight REST coupling.

How to Run Locally
Prerequisites
Docker & Docker Compose installed.

Execution Steps
Clone the repository:

Bash
git clone [https://github.com/Yogendra6556/microservices-nats-system.git](https://github.com/Yogendra6556/microservices-nats-system.git)
cd microservices-nats-system
Start all microservices:

Bash
docker-compose up --build
Verify running containers:

API Gateway: http://localhost:3000

NATS Dashboard / Monitor: http://localhost:8222

API Documentation
Create User
HTTP Method: POST

URL: http://localhost:3000/api/v1/users

Headers: Content-Type: application/json

Request Body:

JSON
{
  "name": "Yogendra Rai",
  "email": "Yogendra@example.com"
}
Success Response (201 Created):

JSON
{
  "status": "SUCCESS",
  "data": {
    "id": "1723485600000",
    "name": "Yogendra Rai",
    "email": "Yogendra@example.com",
    "createdAt": "2026-08-12T10:15:00.000Z"
  }
}
Testing the Event Flow
Trigger the endpoint using curl or Postman:

Bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul Sharma","email":"rahul@example.com"}'
Check container logs to verify asynchronous processing:

Bash
docker logs -f notification-service
Expected output:
[NOTIFICATION] Welcome email sent to rahul@example.com (ID: ...)
