package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// noCacheMiddleware adds headers to prevent caching
func noCacheMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set headers to prevent caching
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		w.Header().Set("Surrogate-Control", "no-store")
		
		// Call the next handler
		next(w, r)
	}
}

func main() {
	// Set the port
	port := ":5002"
	
	// Create a file server handler for static files
	fs := http.FileServer(http.Dir("."))
	
	// Handle all routes by serving the file server with no-cache middleware
	http.HandleFunc("/", noCacheMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Check if the requested file exists
		path := filepath.Join(".", r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			// If file doesn't exist, serve index.html for SPA routing
			http.ServeFile(w, r, "index.html")
			return
		}
		
		// Serve the file if it exists
		fs.ServeHTTP(w, r)
	}))
	
	log.Printf("Server starting on port %s", port)
	log.Printf("Access the application at: http://localhost%s", port)
	log.Printf("Cache disabled for all responses")
	
	// Start the server
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal("Error starting server: ", err)
	}
} 