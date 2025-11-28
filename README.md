# CryptoPulse

CryptoPulse is a dynamic cryptocurrency dashboard that provides real-time market data and visualizations. It is built with Node.js and Express.js, and it leverages the CoinGecko API for up-to-date cryptocurrency information.

## Features

*   **Real-time Market Data:** View the top 12 cryptocurrencies by market capitalization with real-time price updates.
*   **Interactive Charts:** Visualize market trends with interactive graphs and charts powered by Chart.js.
*   **Efficient Caching:** A server-side caching layer reduces external API calls and ensures a responsive user experience.
*   **External News Integration:** Direct links to the latest cryptocurrency news from CoinMarketCap.

## System Architecture and Data Flow

The application follows a client-server architecture:

1.  **Client (Frontend):** The frontend is rendered using EJS templates, HTML, CSS, and client-side JavaScript. It is responsible for displaying the data and handling user interactions.
2.  **Server (Backend):** The backend is built with Node.js and Express.js. It serves the frontend assets and exposes a set of API endpoints.
3.  **External API:** The server communicates with the CoinGecko API to fetch the latest cryptocurrency market data.

### Data Flow

The data flow is designed for efficiency and resilience:

1.  A client request to the root endpoint (`/`) triggers a data fetch on the server.
2.  The server first checks its in-memory cache for valid (non-expired) data.
3.  **Cache Hit:** If valid data is found in the cache, it is served directly to the client, resulting in a fast response.
4.  **Cache Miss:** If the cache is empty or the data is expired (older than 5 minutes), the server makes a new API call to CoinGecko.
5.  The server updates the in-memory cache with the fresh data and then serves it to the client.
6.  **API Failure:** In case of an error from the CoinGecko API, the server will serve stale data from the cache if available, ensuring the application remains functional.

## Project Structure

The project is organized into the following main directories:

```
├── app.js                # Main application file (server, routes, caching)
├── package.json          # Project dependencies and scripts
├── vercel.json           # Vercel deployment configuration
├── .gitignore            # Git ignore file
├── public/               # Static assets
│   ├── css/              # CSS stylesheets
│   ├── js/               # Client-side JavaScript
│   ├── images/           # Image assets
│   └── animations/       # Lottie animations
└── views/                # EJS templates
    ├── index.ejs         # Main page template
    ├── graphs.ejs        # Graphs page template
    └── partials/         # Reusable EJS partials (header, footer, etc.)
```

## API Endpoints

The application exposes the following endpoints:

| Method | Endpoint   | Description                                           |
|--------|------------|-------------------------------------------------------|
| GET    | `/`        | Renders the main dashboard with cryptocurrency data.  |
| GET    | `/home`    | Redirects to the main dashboard (`/`).                |
| GET    | `/graphs`  | Renders the graphs page.                              |
| GET    | `/news`    | Redirects to the CoinMarketCap news page.             |
| GET    | `/about`   | Renders the about page.                               |
| GET    | `/markets` | Renders the markets page.                             |

## Running Locally

To run CryptoPulse on your local machine, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Emp1500/cryptipulse.git
    cd cryptipulse
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Server:**
    ```bash
    npm start
    ```

4.  **Access the Application:**
    Open your browser and navigate to `http://localhost:3000`.

## Roadmap

Future enhancements could include:

*   **Real-time Updates with WebSockets/SSE:** Implement Server-Sent Events or WebSockets for true real-time data streaming without page reloads.
*   **User Accounts:** Allow users to create accounts to save their favorite cryptocurrencies.
*   **Expanded Charting:** Add more advanced charting features and technical indicators.
*   **Database Integration:** Replace the in-memory cache with a persistent data store like Redis for better scalability.

## License

This project is licensed under the ISC License.