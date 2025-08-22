# pwa-scheduler

## Overview
This project is a Vue.js Progressive Web Application (PWA) designed for scheduling tasks. It utilizes Docker for containerization and Vite as the build tool.

## Project Structure
```
pwa-scheduler
├── src
│   ├── main.ts
│   ├── App.vue
├── public
│   ├── manifest.json
│   └── service-worker.js
├── Dockerfile
├── docker-compose.yml
├── package.json
├── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pwa-scheduler
   ```

2. Build the Docker image:
   ```bash
   docker-compose build
   ```

3. Start the application:
   ```bash
   docker-compose up
   ```

### Usage
- Access the application at `http://localhost:5173`.
- The application supports offline functionality and can be installed as a PWA.

### SSH

```
docker exec -it pwa-scheduler sh
```

## Contributing
Feel free to submit issues or pull requests for improvements and bug fixes.

## License
This project is licensed under the MIT License.