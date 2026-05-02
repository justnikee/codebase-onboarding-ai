package db

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect() {
	dns := os.Getenv("DATABASE_URL")

	pool, err := pgxpool.New(context.Background(), dns)

	if err != nil {
		log.Fatal("Unable to connect to database", err)
	}

	DB = pool

	log.Println("Connected to database")
}

func Ping() {
	var one int

	err := DB.QueryRow(context.Background(), "select 1").Scan(&one)

	if err != nil {
		log.Fatal("Unable to ping database", err)
	}

	log.Println("Pinged database")
}
