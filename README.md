# 🎮 Multiplayer Tic-Tac-Toe Game with Nakama Backend

A production-ready, multiplayer Tic-Tac-Toe game with server-authoritative architecture using Nakama as the backend infrastructure.

## 🌟 Features

### Core Features

- ✅ **Server-Authoritative Game Logic** - All game state managed server-side
- ✅ **Real-time Multiplayer** - Instant synchronization between players
- ✅ **Automatic Matchmaking** - Find opponents automatically
- ✅ **Player Authentication** - Device-based authentication
- ✅ **Game Room Management** - Create and join game rooms
- ✅ **Graceful Disconnection Handling** - Handle player drops elegantly

### Bonus Features

- 🎯 **Concurrent Game Support** - Multiple simultaneous game sessions
- 🏆 **Global Leaderboard** - Track wins, losses, and rankings
- ⏱️ **Timer-Based Game Mode** - 30-second turn timer
- 📊 **Player Statistics** - Win rate, streaks, and performance tracking
- 📱 **Responsive Mobile UI** - Optimized for all devices
- 🎨 **Modern UI/UX** - Beautiful gradient design with smooth animations

## 🏗️ Architecture

### Technology Stack

**Backend:**

- Nakama (version 3.21.1) - Game server
- PostgreSQL 16 - Database
- TypeScript - Server runtime modules

**Frontend:**

- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool
- TailwindCSS - Styling
- Nakama JS SDK - Client library

**Deployment:**

- Docker & Docker Compose - Containerization
- Nginx - Web server
- AWS ECS - Cloud hosting (optional)

### System Architecture

```
┌─────────────┐         WebSocket          ┌──────────────┐
│   Frontend  │◄──────────────────────────►│    Nakama    │
│   (React)   │         (Real-time)         │    Server    │
└─────────────┘                             └──────┬───────┘
                                                   │
                                                   │ SQL
                                                   ▼
                                            ┌──────────────┐
                                            │  PostgreSQL  │
                                            │   Database   │
                                            └──────────────┘
```

### Game Flow

1. **Authentication**: Players authenticate with device ID
2. **Matchmaking**: Find or create a game room
3. **Game Play**: Real-time turn-based gameplay
4. **Game End**: Update leaderboard and stats
5. **Play Again**: Quick rematch or return to menu

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Local Development Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd LilaBackendAssignment
```

2. **Set up Nakama modules**

```bash
cd nakama/data/modules
npm install
npm run build
cd ../../..
```

3. **Start the services with Docker Compose**

```bash
docker-compose up -d
```

4. **Access the application**

- Frontend: http://localhost:80
- Nakama Console: http://localhost:7351
  - Username: `admin`
  - Password: `password`
- Nakama API: http://localhost:7350

### Manual Development Setup

If you prefer to run services individually:

**1. Start Nakama and PostgreSQL:**

```bash
cd nakama
docker-compose up -d
```

**2. Build Nakama modules:**

```bash
cd data/modules
npm install
npm run build
# Watch for changes (optional)
npm run watch
```

**3. Start Frontend:**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# Frontend will be available at http://localhost:3000
```

## 📝 Configuration

### Environment Variables

**Frontend (.env):**

```env
VITE_NAKAMA_HOST=localhost
VITE_NAKAMA_PORT=7350
VITE_NAKAMA_SSL=false
```

**Backend (Docker Compose):**

```env
POSTGRES_PASSWORD=nakama_password
NAKAMA_HOST=localhost
NAKAMA_PORT=7350
```

### Nakama Configuration

Located at `nakama/data/nakama-config.yml`:

- Server ports and credentials
- Match settings
- Leaderboard configuration
- Session management

## 🎮 How to Play

### Starting a Game

1. **Open the application** in your browser
2. **Choose game mode**:
   - **Classic**: No time limit per turn
   - **Timed**: 30 seconds per turn
3. **Click "Find Match"** to start matchmaking
4. **Wait for opponent** to join
5. **Play the game** when both players are ready

### Game Rules

- Players take turns placing X or O on a 3x3 grid
- First player to get 3 in a row (horizontal, vertical, or diagonal) wins
- If all cells are filled with no winner, the game is a draw
- In timed mode, if time runs out, the other player wins

### Testing Multiplayer

To test multiplayer functionality:

1. **Open two browser windows/tabs**
2. **In each window:**
   - Open the application
   - Select the same game mode
   - Click "Find Match"
3. **The two players will be matched together**
4. **Play the game** between the two windows

Alternatively, you can:

- Use different browsers (Chrome, Firefox, etc.)
- Use incognito/private browsing mode
- Use different devices on the same network

## 📊 Game Features in Detail

### Server-Authoritative Game Logic

All game logic runs on the Nakama server:

- Move validation
- Winner detection
- Turn management
- Timer enforcement
- Anti-cheat protection

**Implementation**: `nakama/data/modules/match_handler.ts`

### Matchmaking System

Automatic player matching:

- Find existing waiting games
- Create new games if none available
- Support for different game modes
- Instant or create-and-wait matching

**RPC Endpoints**:

- `create_match` - Create a new game room
- `find_match` - Find or create a match

### Leaderboard System

Global ranking with statistics:

- Score-based ranking (wins +3, draws +1, losses -1)
- Win/loss/draw records
- Win streak tracking
- Real-time updates
- Top 100 players displayed

**Features**:

- Persistent across sessions
- Automatic updates after each game
- Medal icons for top 3 players
- Detailed player statistics

### Timer-Based Mode

Adds urgency with turn timers:

- 30-second countdown per turn
- Visual timer display
- Auto-forfeit on timeout
- Server-side enforcement
- Color warning at 10 seconds

## 🔧 Development

### Project Structure

```
LilaBackendAssignment/
├── nakama/                      # Nakama server
│   ├── data/
│   │   ├── modules/             # TypeScript modules
│   │   │   ├── src/
│   │   │   │   ├── game/        # Game logic
│   │   │   │   │   ├── state.ts       # Match state interface
│   │   │   │   │   ├── tic_tac_toe.ts # Win detection & validation
│   │   │   │   │   └── timer.ts       # Turn timer logic
│   │   │   │   ├── rpc/         # RPC handlers
│   │   │   │   │   ├── create_match.ts
│   │   │   │   │   ├── find_match.ts
│   │   │   │   │   ├── get_leaderboard.ts
│   │   │   │   │   └── get_player_stats.ts
│   │   │   │   ├── storage/     # Data persistence
│   │   │   │   │   └── stats.ts       # Player stats management
│   │   │   │   ├── types/       # TypeScript definitions
│   │   │   │   │   └── nakama.d.ts
│   │   │   │   ├── utils/       # Constants & utilities
│   │   │   │   │   └── constants.ts
│   │   │   │   ├── index.ts     # Main entry point
│   │   │   │   └── match_handler.ts   # Match lifecycle handlers
│   │   │   ├── build/           # Compiled JS output
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   └── nakama-config.yml    # Server config
│   └── docker-compose.yml
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── GameBoard.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── PlayerStatsCard.tsx
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx # Dark/light theme
│   │   ├── services/
│   │   │   └── nakama.ts        # Nakama client service
│   │   ├── App.tsx              # Main app component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Tailwind styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
├── deployment/                  # Deployment configs
│   └── AWS_DEPLOYMENT.md
├── docker-compose.yml           # Full stack compose
└── README.md
```

### Nakama Server Modules

**Match Handler** (`match_handler.ts`):

- `matchInit` - Initialize game state with board, players, mode
- `matchJoinAttempt` - Validate player can join (max 2 players)
- `matchJoin` - Handle player join, assign X/O symbols, fetch display name
- `matchLeave` - Handle player leave, award win to remaining player
- `matchLoop` - Game loop (check turn timeouts in timed mode)
- `handleMakeMove` - Validate and apply moves, check for winner/draw

**Game Logic** (`game/`):

- `tic_tac_toe.ts` - Win detection, move validation
- `state.ts` - Match state interface and serialization
- `timer.ts` - Turn timer utilities

**RPC Handlers** (`rpc/`):

- `create_match.ts` - Create new game room
- `find_match.ts` - Queue-based matchmaking with mode support
- `get_leaderboard.ts` - Fetch global rankings with stats
- `get_player_stats.ts` - Get individual player statistics

**Storage** (`storage/`):

- `stats.ts` - Player stats CRUD, score calculation, leaderboard updates

### Frontend Components

- **App.tsx** - Main application logic, screens (nickname, menu, matchmaking, game, game-over)
- **GameBoard.tsx** - 3x3 game grid with moves, turn indicator, timer display
- **Leaderboard.tsx** - Global rankings modal with medals for top 3
- **PlayerStatsCard.tsx** - Player statistics display card
- **ThemeContext.tsx** - Dark/light theme toggle support
- **nakama.ts** - Nakama client service wrapper (auth, WebSocket, RPCs)

### Building for Production

**Build Nakama modules:**

```bash
cd nakama/data/modules
npm run build
```

**Build Frontend:**

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

**Build Docker images:**

```bash
# Full stack
docker-compose build

# Individual services
docker build -t tictactoe-nakama ./nakama
docker build -t tictactoe-frontend ./frontend
```

## ☁️ Cloud Deployment

### AWS Deployment

Comprehensive AWS deployment guide: [deployment/AWS_DEPLOYMENT.md](deployment/AWS_DEPLOYMENT.md)

**Quick AWS Setup:**

1. **Create RDS PostgreSQL database**
2. **Create ECR repositories**
3. **Build and push Docker images**
4. **Create ECS cluster and services**
5. **Configure Application Load Balancer**
6. **Set up domain and SSL certificate**

Estimated monthly cost: ~$75 (see AWS_DEPLOYMENT.md for details)

### Alternative Deployment Options

**Railway (Recommended for quick deployment):**
- GitHub integration with auto-deployment
- Built-in PostgreSQL database
- Simple environment variable setup
- ~$15-25/month
- **[Railway Deployment Guide](deployment/RAILWAY_DEPLOYMENT.md)**

**DigitalOcean:**

- Use App Platform for containers
- Managed PostgreSQL database
- Simple one-click deployment
- ~$30/month

**Heroku:**

- Container registry support
- Heroku Postgres
- Easy scaling
- ~$25/month

**AWS:**

- Most scalable option
- [AWS Deployment Guide](deployment/AWS_DEPLOYMENT.md)
- ~$75/month

### Deployment Checklist

- [ ] Set strong database password
- [ ] Configure environment variables
- [ ] Enable HTTPS/SSL
- [ ] Set up custom domain
- [ ] Configure CORS properly
- [ ] Enable monitoring/logging
- [ ] Set up backups
- [ ] Test multiplayer functionality
- [ ] Load test the server
- [ ] Document deployment URLs

## 🧪 Testing

### Local Testing

**Test authentication:**

```bash
curl http://localhost:7350/v2/account/authenticate/device \
  -H "Authorization: Basic <base64(serverkey:)>" \
  -d '{"id":"test-device-123"}'
```

**Test matchmaking:**

```bash
# Authenticate first, then:
curl -X POST http://localhost:7350/v2/rpc/find_match \
  -H "Authorization: Bearer <session-token>" \
  -d '{"mode":"classic"}'
```

**Test leaderboard:**

```bash
curl -X POST http://localhost:7350/v2/rpc/get_leaderboard \
  -H "Authorization: Bearer <session-token>"
```

### Multiplayer Testing

See "Testing Multiplayer" section above for browser-based testing.

### Load Testing

Use tools like:

- **Artillery** - `artillery quick --count 10 -n 20 http://localhost:80`
- **k6** - Nakama-specific load tests
- **Apache JMeter** - GUI-based testing

## 📈 Monitoring

### Nakama Console

Access at http://localhost:7351

Monitor:

- Active matches
- Connected players
- Leaderboard data
- Storage data
- Real-time metrics

### Logs

View Docker logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nakama
docker-compose logs -f frontend
```

### Health Checks

- Nakama: http://localhost:7350/
- Frontend: http://localhost:80

## 🔒 Security

### Implemented Security Measures

- ✅ Server-authoritative game logic (prevents cheating)
- ✅ Move validation on server
- ✅ Device authentication
- ✅ Session tokens with expiry
- ✅ Rate limiting on Nakama
- ✅ Input sanitization
- ✅ CORS configuration

### Production Security Recommendations

- Use HTTPS/TLS for all connections
- Use environment variables for secrets
- Enable PostgreSQL SSL
- Implement rate limiting
- Add WAF for DDoS protection
- Regular security audits
- Keep dependencies updated

## 🐛 Troubleshooting

### Common Issues

**1. Cannot connect to Nakama**

- Check if Nakama is running: `docker ps`
- Verify port 7350 is accessible
- Check firewall settings
- Ensure correct NAKAMA_HOST in .env

**2. Match not starting**

- Ensure both players selected the same game mode
- Check Nakama console for errors
- Verify match modules are built: `ls nakama/data/modules/build/`

**3. Leaderboard not updating**

- Check if leaderboard was created (Nakama console > Leaderboards)
- Verify game completion in logs
- Check for errors in match handler

**4. Build errors**

- Run `npm install` in nakama/data/modules/
- Run `npm install` in frontend/
- Check Node.js version (18+)
- Clear node_modules and reinstall

**5. Docker issues**

- Run `docker-compose down -v` to reset
- Clear volumes: `docker volume prune`
- Rebuild images: `docker-compose build --no-cache`

### Debug Mode

Enable verbose logging in `nakama-config.yml`:

```yaml
logger:
  level: "DEBUG"
```

## 📚 API Documentation

### RPC Endpoints

**Create Match**

```typescript
POST /v2/rpc/create_match
Body: { mode: "classic" | "timed" }
Response: { matchId: string, mode: string }
```

**Find Match**

```typescript
POST /v2/rpc/find_match
Body: { mode: "classic" | "timed" }
Response: { matchId: string, mode: string, isNew: boolean }
```

**Get Leaderboard**

```typescript
POST /v2/rpc/get_leaderboard
Body: { limit?: number }
Response: { leaderboard: LeaderboardEntry[] }
```

**Get Player Stats**

```typescript
POST / v2 / rpc / get_player_stats;
Body: {
}
Response: PlayerStats;
```

### WebSocket Messages

**OpCodes:**

- `1` MAKE_MOVE - Player makes a move
- `2` GAME_UPDATE - Game state update
- `3` GAME_OVER - Game ended
- `4` PLAYER_JOINED - Player joined match
- `5` PLAYER_LEFT - Player left match
- `6` TURN_TIMEOUT - Turn timer expired

## 🤝 Contributing

This is an assignment project, but improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is provided as-is for educational purposes.

## 👨‍💻 Author

Created as part of the Lila Backend Assignment

## 🙏 Acknowledgments

- [Heroic Labs](https://heroiclabs.com/) for Nakama
- [Anthropic](https://www.anthropic.com/) for Claude AI assistance
- React and TypeScript communities

## 📞 Support

For issues or questions:

1. Check the Troubleshooting section
2. Review Nakama documentation: https://heroiclabs.com/docs/
3. Check GitHub issues

## 🎯 Assignment Requirements Checklist

### Core Requirements

- ✅ Server-Authoritative Game Logic
- ✅ Move validation on server
- ✅ Prevent client-side manipulation
- ✅ Broadcast validated game state
- ✅ Matchmaking System
- ✅ Create game rooms
- ✅ Automatic matchmaking
- ✅ Game room discovery and joining
- ✅ Handle player disconnections
- ✅ Deployment ready
- ✅ Docker configuration provided
- ✅ Cloud deployment guide (AWS)

### Optional Features

- ✅ Concurrent Game Support
- ✅ Multiple simultaneous sessions
- ✅ Game room isolation
- ✅ Scalable architecture
- ✅ Leaderboard System
- ✅ Track wins, losses, win streaks
- ✅ Global ranking system
- ✅ Display top players with statistics
- ✅ Persist player performance data
- ✅ Timer-Based Game Mode
- ✅ 30-second turn timer
- ✅ Automatic forfeit on timeout
- ✅ Mode selection in matchmaking
- ✅ Countdown timer in UI

### Deliverables

- ✅ Source code repository
- ✅ README with setup instructions
- ✅ Architecture documentation
- ✅ Deployment documentation
- ✅ API/server configuration details
- ✅ Multiplayer testing instructions

---

**🎮 Happy Gaming! Have fun playing Tic-Tac-Toe with players around the world!**
