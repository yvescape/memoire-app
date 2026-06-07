FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o users-service ./cmd/main.go
RUN go build -o createadmin ./cmd/createadmin/main.go

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/users-service .
COPY --from=builder /app/createadmin .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
EXPOSE 8001
CMD ["./entrypoint.sh"]
