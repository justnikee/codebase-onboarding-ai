package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgconn"
)

type Tx interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}
