# -------------------------------
# 1. Use official Python image
# -------------------------------
FROM python:3.11-slim

# -------------------------------
# 2. Set working directory
# -------------------------------
WORKDIR /app

# -------------------------------
# 3. Copy requirements file
# -------------------------------
COPY requirements.txt .

# -------------------------------
# 4. Install dependencies
# -------------------------------
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# -------------------------------
# 5. Copy application code
# -------------------------------
COPY . .

# -------------------------------
# 6. Expose port for FastAPI
# -------------------------------
EXPOSE 8000

# -------------------------------
# 7. Command to run the app
# -------------------------------
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
