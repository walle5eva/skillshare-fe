import json
from pathlib import Path
import re

file_path = Path("./openapi.json")
save_path = Path("./openapi_modified.json")

def to_camel_case(snake_str):
    components = snake_str.split('_')
    return components[0] + ''.join(word.capitalize() for word in components[1:])

def generate_transformed_openapi_spec(file_path: Path = file_path, save_path: Path = save_path):
    openapi_content = json.loads(file_path.read_text())
    for path_data in openapi_content["paths"].values():
        for operation in path_data.values():
            operation_id = operation["operationId"]
            operation["operationId"] = to_camel_case(operation_id)

    save_path.write_text(json.dumps(openapi_content, indent=2))

generate_transformed_openapi_spec()