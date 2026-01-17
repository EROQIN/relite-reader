package tasks

// Store persists tasks for users.
type Store interface {
	Create(task Task) (Task, error)
	Update(task Task) error
	Get(userID, id string) (Task, error)
	ListByUser(userID string) ([]Task, error)
}
