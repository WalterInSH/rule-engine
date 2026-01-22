# Simple Rule Engine Demo (Spring Boot Edition)

This project demonstrates a dynamic rule engine implementation inspired by the `security-strategy-center` architecture. It is now a **Spring Boot Application**.

## How It Works

1.  **Rule Definition**: Rules are defined in `src/main/resources/rules.json`.
2.  **Startup**: The application loads the rules from the JSON file on startup.
3.  **Dynamic Compilation**: The engine dynamically generates Java source code for each rule and compiles it in-memory using **Arthas Memory Compiler**.
4.  **REST API**: Exposes endpoints to execute and reload rules.

## Project Structure

*   **`com.demo.SimpleRuleEngineApplication`**: Main Spring Boot entry point.
*   **`com.demo.controller.RuleController`**: REST Controller exposing endpoints.
*   **`com.demo.engine.RuleEngine`**: Service responsible for managing rule compilation and execution.
*   **`com.demo.builder` / `com.demo.compiler`**: Utilities for code generation and compilation.

## Dependencies

*   **Spring Boot Web**: For REST API and container.
*   **Arthas Memory Compiler**: For dynamic compilation.
*   **FastJSON**: For JSON handling.
*   **Lombok**: For boilerplate code reduction.

## How to Run

1.  Navigate to the project directory:
    ```bash
    cd simple-rule-engine
    ```

2.  Run with Maven:
    ```bash
    mvn spring-boot:run
    ```

## API Endpoints

### 1. Execute Rules
**POST** `/api/rules/execute`

Body (JSON):
```json
{
  "amount": 15000.0,
  "country": "US"
}
```

Response (JSON):
```json
{
  "amount": 15000.0,
  "country": "US",
  "risk_level": "HIGH",
  "region": "NA"
}
```

### 2. Reload Rules
**POST** `/api/rules/reload`

Body (JSON) - List of Rules:
```json
[
  {
    "id": "1003",
    "priority": 1,
    "actionType": "PARAM",
    "runType": "SYNC",
    "condition": "params.getIntValue(\"age\") < 18",
    "action": "params.put(\"minor\", true);"
  }
]
```