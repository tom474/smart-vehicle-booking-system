# run.py

import uvicorn
import os

if __name__ == "__main__":
    # This is the entry point for running the application.
    # It uses uvicorn to serve the FastAPI app instance created in app/main.py.
    #
    # To run the server, execute the following command in your terminal:
    # python run.py
    #
    # - "app.main:app": Points to the 'app' instance in the 'app/main.py' file.
    # - host="0.0.0.0": Makes the server accessible on your local network.
    # - port=8000: The port the server will listen on.
    # - reload=True: The server will automatically restart when you save changes
    #                to the code, which is very useful for development.
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development"
    )
