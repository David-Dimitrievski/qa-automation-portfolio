# Playwright image version must match @playwright/test in package.json.
FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENTRYPOINT ["npx", "playwright", "test"]
