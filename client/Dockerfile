FROM oven/bun:alpine AS base

ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

ARG GOOGLE_MAPS_API_KEY
ENV GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY

ARG NEXT_PUBLIC_MICROSOFT_CLIENT_ID
ENV NEXT_PUBLIC_MICROSOFT_CLIENT_ID=$NEXT_PUBLIC_MICROSOFT_CLIENT_ID

ARG NEXT_PUBLIC_MICROSOFT_TENANT_ID
ENV NEXT_PUBLIC_MICROSOFT_TENANT_ID=$NEXT_PUBLIC_MICROSOFT_TENANT_ID

ARG NEXT_PUBLIC_MICROSOFT_CALLBACK_URL
ENV NEXT_PUBLIC_MICROSOFT_CALLBACK_URL=$NEXT_PUBLIC_MICROSOFT_CALLBACK_URL

ARG POST_LOGOUT_URL
ENV POST_LOGOUT_URL=$POST_LOGOUT_URL

WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install-dev
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
FROM base AS install-prod
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install-dev /temp/dev/node_modules node_modules
COPY . .

# build the application
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install-prod /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/.next ./.next
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/public ./public

# expose the port
EXPOSE 3000

# start the application
ENTRYPOINT ["bunx"]
CMD ["next", "start", "-p", "3000", "-H", "0.0.0.0"]