# MongoDB Setup for Agent Dev Tool Backend

This directory contains the Docker Compose configuration for running MongoDB locally.

## Quick Start

### Start MongoDB

```bash
cd MongoDB
docker-compose up -d
```

This will start:
- **MongoDB** on port `27017`
- **Mongo Express** (web UI) on port `8081`

### Stop MongoDB

```bash
docker-compose down
```

### Stop and Remove Volumes

```bash
docker-compose down -v
```

**Warning**: This will delete all data in MongoDB!

## Services

### MongoDB
- **Container**: `agent-dev-tool-mongodb`
- **Port**: `27017`
- **Image**: `mongodb/mongodb-atlas-local:8.0`
- **Connection String**: `mongodb://localhost:27017/?directConnection=true`

**Important**: This specific image (`mongodb/mongodb-atlas-local:8.0`) is required because it supports **vector search capabilities** needed for the policy vector store. Regular MongoDB images do not include these features.

### Mongo Express (Web UI)
- **Container**: `agent-dev-tool-mongo-express`
- **Port**: `8081`
- **URL**: http://localhost:8081
- **Username**: `admin`
- **Password**: `admin`

## Database Configuration

The backend uses the following database and collections:

- **Database**: `agent_dev_tool_db` (configured in `appsettings.json`)
- **Collections**:
  - `chat_history` - Chat message history
  - `return-policy` - Return policy vector store
  - `refund-policy` - Refund policy vector store
  - `order-cancellation-policy` - Cancellation policy vector store

## Health Check

MongoDB includes a health check that ensures the database is ready before other services start.

## Troubleshooting

### MongoDB Container Unhealthy

If you see "container is unhealthy" error:

1. **Check MongoDB logs**:
   ```bash
   docker-compose logs mongodb
   ```

2. **Try starting MongoDB only** (without mongo-express):
   ```bash
   docker-compose up -d mongodb
   ```

3. **Wait a bit longer** - MongoDB Atlas Local can take 30-60 seconds to fully start:
   ```bash
   docker-compose up -d mongodb
   sleep 60
   docker-compose up -d mongo-express
   ```

4. **If healthcheck keeps failing**, you can temporarily disable it:
   - Comment out the `depends_on` section in mongo-express
   - Or remove the healthcheck and start services manually

5. **Important**: Do NOT replace `mongodb/mongodb-atlas-local:8.0` with standard MongoDB images (`mongo:8.0`) as they don't support vector search features required by the vector store. The vector store needs Atlas-specific vector search capabilities.

### Port Already in Use

If port 27017 is already in use, you can:
1. Stop the existing MongoDB instance
2. Or change the port mapping in `docker-compose.yml`:
   ```yaml
   ports:
     - "27018:27017"  # Use 27018 instead
   ```
   Then update `appsettings.json` to use port 27018.

### View Logs

```bash
# MongoDB logs
docker-compose logs -f mongodb

# Mongo Express logs (to see connection errors)
docker-compose logs -f mongo-express
```

### Check Container Status

```bash
docker ps -a
docker inspect agent-dev-tool-mongodb
```

### Access MongoDB Shell

```bash
docker exec -it agent-dev-tool-mongodb mongosh
```

### Mongo Express Connection Issues

If Mongo Express shows errors when accessing http://localhost:8081:

1. **Check Mongo Express logs**:
   ```bash
   docker-compose logs mongo-express
   ```

2. **Wait for MongoDB to be fully ready**:
   ```bash
   # Check if MongoDB is responding
   docker exec -it agent-dev-tool-mongodb mongosh --eval "db.adminCommand('ping')"
   
   # If MongoDB is ready, restart mongo-express
   docker-compose restart mongo-express
   ```

3. **Verify MongoDB is accessible from mongo-express container**:
   ```bash
   docker exec -it agent-dev-tool-mongo-express ping mongodb
   ```

4. **Check if port 8081 is already in use**:
   ```bash
   lsof -i :8081
   # or
   netstat -tuln | grep 8081
   ```

5. **If port conflict exists**, change mongo-express port in docker-compose.yml:
   ```yaml
   ports:
     - "8082:8081"  # Use 8082 instead
   ```

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d
```

