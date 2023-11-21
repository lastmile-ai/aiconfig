import openai
import pytest
import os

from openai.types import ImagesResponse, Image
from openai.types.chat import ChatCompletion


# pytest patch side effect for mocking openai calls. Use as a decorator on a test function. `@patch.object(openai.ChatCompletion, "create", side_effect=mock_openai_chat_completion)`
def mock_openai_chat_completion(**kwargs):
    response_map_list = [
        # Define the response for each set of input parameters. Format: [[input_params, response]]
        # Example 1
        [
            {
                "model": "gpt-3.5-turbo",
                "top_p": 1,
                "max_tokens": 3000,
                "temperature": 1,
                "stream": False,
                "messages": [
                    {
                        "content": "Write me a MySQL query to get this final output: total revenue from sales for each product category. Use the tables relationships defined here: Employees are related to Departments through the &#x27;DepartmentID&#x27; field..",
                        "role": "user",
                    }
                ],
            },
            ChatCompletion(
                **{
                    "id": "chatcmpl-8KZBExTKtsDnJGQjIF8rS9ZggECKn",
                    "choices": [
                        {
                            "finish_reason": "stop",
                            "index": 0,
                            "message": {
                                "content": "To calculate the total revenue from sales for each product category, we need to join multiple tables and perform aggregation. Assuming you have the following tables:\n\n1. Employees (with DepartmentID)\n2. Departments (with DepartmentID)\n3. Products (with ProductID)\n4. Sales (with EmployeeID, ProductID, and Revenue)\n\nHere is the MySQL query to obtain the desired output:\n\n```sql\nSELECT d.Category, SUM(s.Revenue) AS TotalRevenue\nFROM Sales s\nJOIN Employees e ON s.EmployeeID = e.EmployeeID\nJOIN Departments d ON e.DepartmentID = d.DepartmentID\nJOIN Products p ON s.ProductID = p.ProductID\nGROUP BY d.Category;\n```\n\nIn this query, we are joining the `Sales` table with the `Employees` table based on the `EmployeeID` column, then joining that result with the `Departments` table based on the `DepartmentID` column. Finally, we join this intermediate result with the `Products` table based on the `ProductID` column.\n\nThe `SUM(s.Revenue)` function calculates the total revenue for each group. We use the `GROUP BY` clause to group the results by the `Category` column from the `Departments` table.\n\nThis query will provide you with the final output of the total revenue from sales for each product category.",
                                "role": "assistant",
                                "function_call": None,
                                "tool_calls": None,
                            },
                        }
                    ],
                    "created": 1699912484,
                    "model": "gpt-3.5-turbo-0613",
                    "object": "chat.completion",
                    "system_fingerprint": None,
                    "usage": {"completion_tokens": 297, "prompt_tokens": 53, "total_tokens": 350},
                }
            ),
        ],
        # Example 2
        [
            {
                "model": "gpt-3.5-turbo",
                "temperature": 1,
                "top_p": 1,
                "stream": False,
                "messages": [
                    {"content": "Hi! Tell me 10 cool things to do in NYC.", "role": "user"}
                ],
            },
            ChatCompletion(
                **{
                    "id": "chatcmpl-8KZCn0XkSMuHHxhoBik45t32eNbyi",
                    "choices": [
                        {
                            "finish_reason": "stop",
                            "index": 0,
                            "message": {
                                "content": "1. Visit Times Square: Experience the bright lights and bustling atmosphere of this iconic NYC landmark. Enjoy shopping, dining, and various entertainment options.\n\n2. Explore Central Park: Take a leisurely stroll or rent a bike to explore the beautiful landscapes, visit the Central Park Zoo, have a picnic, or even go horseback riding.\n\n3. Walk the High Line: This elevated park built on a historic freight rail line offers stunning views of the city skyline, beautiful gardens, art installations, and a unique perspective of NYC.\n\n4. Take a ferry to the Statue of Liberty: Visit the iconic Statue of Liberty on Liberty Island and enjoy breathtaking views of the city from the Crown or the pedestal. You can also explore Ellis Island's immigration museum nearby.\n\n5. Visit the Metropolitan Museum of Art: Explore the vast collections of art and artifacts from around the world at the Met and immerse yourself in the rich cultural history.\n\n6. Discover the vibrant neighborhoods: Explore the diverse neighborhoods of NYC, such as Chinatown, Little Italy, Greenwich Village, and Williamsburg. Enjoy authentic cuisine, unique shops, and immerse yourself in different cultures.\n\n7. Catch a Broadway show: Experience the magic of Broadway by watching a world-class performance at one of the many theaters in the Theater District.\n\n8. Walk across the Brooklyn Bridge: Enjoy panoramic views of the city as you walk or bike across the iconic Brooklyn Bridge, connecting Manhattan and Brooklyn.\n\n9. Explore the Museum of Modern Art (MoMA): Discover modern and contemporary art at MoMA, featuring masterpieces by artists like Van Gogh, Picasso, Warhol, and many more.\n\n10. Enjoy the food scene: NYC is a food lover's paradise. Indulge in diverse culinary experiences, from street food to Michelin-starred restaurants. Don't forget to try New York-style pizza, bagels, and the famous cronut.",
                                "role": "assistant",
                                "function_call": None,
                                "tool_calls": None,
                            },
                        }
                    ],
                    "created": 1699912581,
                    "model": "gpt-3.5-turbo-0613",
                    "object": "chat.completion",
                    "system_fingerprint": None,
                    "usage": {"prompt_tokens": 20, "completion_tokens": 379, "total_tokens": 399},
                }
            ),
        ],
    ]

    for input_params, response in response_map_list:
        if kwargs == input_params:
            return response
    raise Exception("Unexpected arguments:\n {}".format(kwargs))


def mock_openai_dalle_image_response(**kwargs):
    response_map_list = [
        # Define the response for each set of input parameters. Format: [[input_params, response]]
        # Example 1
        [
            {
                "model": "dall-e-3",
                "n": 1,
                "size": "1024x1024",
                "prompt": "Panda eating dumplings on a yellow mountain",
            },
            ImagesResponse(
                **{
                    "created": 1700542907,
                    "data": [Image(**{"base64": None, "revised_prompt": "A black and white panda bear delicately nibbling on a delightful feast of plump dumplings. The panda is situated on a scenic, rugged mountain that displays a unique yellow hue. It's a serene and playful scene as the panda thoroughly enjoys its flavorful meal against the eye-catching backdrop of the vibrant yellow mountain.", "url": 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-o8J42XpAe8XLnxJ01WbOsM4M/user-AT3ivBdlHeOcDX62AOM5Je23/img-0TgfmMRhqq6ebTAdGNkpSrvr.png?st=2023-11-20T23%3A37%3A36Z&se=2023-11-21T01%3A37%3A36Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2023-11-20T20%3A19%3A16Z&ske=2023-11-21T20%3A19%3A16Z&sks=b&skv=2021-08-06&sig=8gEDsXUZLC8531CxqshfgFpI31Kd92OigXPZ/7DaTjE%3D'})],
                }
            )
        ],
    ]
    for input_params, response in response_map_list:
        if kwargs == input_params:
            return response
    raise Exception("Unexpected arguments:\n {}".format(kwargs))

@pytest.fixture
def set_temporary_env_vars():
    """
    A pytest fixture to set fake values for specific environment variables
    and restore their original values after the test.

    Usage:
        Use this fixture by adding it as an argument to your test function.

    Example:
        def test_something(set_temporary_env_vars):
            # Your test code here

    This fixture sets fake values for the following environment variables:
    - OPENAI_API_KEY

    It restores the original values (if they existed) after the test is complete.
    """
    # Define the environment variables to be manipulated
    env_vars_to_set = {"OPENAI_API_KEY"}

    # Store the original values of the environment variables
    original_env_values = {}
    for env_var in env_vars_to_set:
        original_env_values[env_var] = os.environ.get(env_var)

    try:
        # Set fake values for the environment variables
        for env_var in env_vars_to_set:
            os.environ[env_var] = "fakekey"

        # Yield control to the test function
        yield
    finally:
        # Clean up: Restore the original values of the environment variables
        for env_var in env_vars_to_set:
            original_value = original_env_values.get(env_var)
            if original_value is not None:
                os.environ[env_var] = original_value
            else:
                del os.environ[env_var]
