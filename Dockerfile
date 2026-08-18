# Stage 1: Build Angular app

FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate
WORKDIR /app

# Copy manifests first for better caching
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of the source code
COPY . .

ARG GIT_BRANCH=$GIT_BRANCH
ARG RAILWAY_GIT_COMMIT_SHA
ENV GIT_COMMIT_SHA=$RAILWAY_GIT_COMMIT_SHA

ARG ORG_API_URL
ENV ORG_API_URL=${ORG_API_URL}

# Write version.json (version/commit/build time) so the running app can detect new deploys
RUN node scripts/write-version.js

# Build Angular app for production, staging, or preview
RUN if [ "$GIT_BRANCH" = "staging" ]; then \
    pnpm run build:staging; \
    elif [ "$GIT_BRANCH" = "preview" ]; then \
    pnpm run build:preview; \
    else \
    pnpm run build:prod; \
    fi

# Stage 2: Serve with nginx

FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular dist output
COPY --from=build /app/dist/jobtask-frontend /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
