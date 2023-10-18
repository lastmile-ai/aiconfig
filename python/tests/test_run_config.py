from aiconfig.Config import AIConfigRuntime
from mock import patch
import openai
import pytest
from .conftest import set_temporary_env_vars, mock_openai_chat_completion





@pytest.mark.asyncio
@patch.object(openai.ChatCompletion, "create", side_effect=mock_openai_chat_completion)
async def test_load_parametrized_data_config(mock_method, set_temporary_env_vars):
    """Test loading a parametrized data config and resolving it

    Config has 2 prompts. Prompt2 uses prompt1.output in its input.
    """
    config = AIConfigRuntime.from_config("aiconfigs/parametrized_data_config.json")

    prompt1_params = {
        "sql_language": "MySQL",
        "output_data": "total revenue from sales for each product category",
        "table_relationships": "Employees are related to Departments through the 'DepartmentID' field.",
    }
    prompt1_resolved = await config.run("prompt1", prompt1_params)
    prompt2_resolved = await config.resolve("prompt2")
    # assert prompt1_resolved == {'model': 'gpt-3.5-turbo', 'top_p': 1, 'max_tokens': 3000, 'temperature': 1,  'messages': [{'content': 'Write me a MySQL query to get this final output: total revenue from sales for each product category. Use the tables relationships defined here: Employees are related to Departments through the &#x27;DepartmentID&#x27; field..', 'role': 'user'}]}
    assert prompt2_resolved == {
        "model": "gpt-4",
        "top_p": 1,
        "max_tokens": 3000,
        "temperature": 1,
        "messages": [
            {
                "content": "You are an expert at SQL. You will output nicely formatted SQL code with labels on columns. You will provide a short 1-2 sentence summary on the code. Name columns as one word using underscore and lowercase. Format Output in markdown ### SQL Query code block with SQL Query &nbsp; ### Summary short summary on code",
                "role": "system",
            },
            {
                "content": "Translate the following into PostgreSQL code:\n To calculate the total revenue from sales for each product category, we need to join multiple tables and perform aggregation. Assuming you have the following tables:\n\n1. Employees (with DepartmentID)\n2. Departments (with DepartmentID)\n3. Products (with ProductID)\n4. Sales (with EmployeeID, ProductID, and Revenue)\n\nHere is the MySQL query to obtain the desired output:\n\n&#x60;&#x60;&#x60;sql\nSELECT d.Category, SUM(s.Revenue) AS TotalRevenue\nFROM Sales s\nJOIN Employees e ON s.EmployeeID = e.EmployeeID\nJOIN Departments d ON e.DepartmentID = d.DepartmentID\nJOIN Products p ON s.ProductID = p.ProductID\nGROUP BY d.Category;\n&#x60;&#x60;&#x60;\n\nIn this query, we are joining the &#x60;Sales&#x60; table with the &#x60;Employees&#x60; table based on the &#x60;EmployeeID&#x60; column, then joining that result with the &#x60;Departments&#x60; table based on the &#x60;DepartmentID&#x60; column. Finally, we join this intermediate result with the &#x60;Products&#x60; table based on the &#x60;ProductID&#x60; column.\n\nThe &#x60;SUM(s.Revenue)&#x60; function calculates the total revenue for each group. We use the &#x60;GROUP BY&#x60; clause to group the results by the &#x60;Category&#x60; column from the &#x60;Departments&#x60; table.\n\nThis query will provide you with the final output of the total revenue from sales for each product category.",
                "role": "user",
            },
        ],
    }
