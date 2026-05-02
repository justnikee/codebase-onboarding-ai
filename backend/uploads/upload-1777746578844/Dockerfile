#downloads the golang image from docker hub
FROM golang:1.24-alpine AS builder

# creates the working directory in container
WORKDIR /app

# copies the go.mod and go.sum files to the working directory
COPY go.mod go.sum ./

# downloads the dependencies
RUN go mod download

# copies the rest of the application code to the working directory
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server


FROM gcr.io/distroless/base-debian12

WORKDIR /app
COPY --from=builder /app/server /app/server

EXPOSE 8080

CMD ["/app/server"]
