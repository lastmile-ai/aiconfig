from aiconfig_tools.Config import AIConfigRuntime
from aiconfig_tools.default_parsers.openai import refine_chat_completion_params
from mock import patch
import openai
import pytest

from ..conftest import mock_openai_chat_completion


def test_refine_chat_completion_params():
    model_settings_with_stream_and_system_prompt = {
        "n": "3",
        "stream": True,
        "system_prompt": "system_prompt",
        "random_attribute": "value_doesn't_matter",
    }
    refined_params = refine_chat_completion_params(model_settings_with_stream_and_system_prompt)

    assert "system_prompt" not in refined_params
    assert "stream" not in refined_params
    assert "random_attribute" not in refined_params
    assert refined_params["n"] == "3"

@pytest.mark.asyncio
@patch.object(openai.ChatCompletion, "create", side_effect=mock_openai_chat_completion)
async def test_get_output_text(mock_method):
    aiconfig = AIConfigRuntime.from_config("../tests/aiconfigs/basic_chatgpt_query_config.json")
    await aiconfig.run("prompt1", {})

    output = aiconfig.get_output_text("prompt1")
    # Mock outputs stored in conftest
    assert output =="1. Visit Times Square: Experience the bright lights and bustling atmosphere of this iconic NYC landmark. Enjoy shopping, dining, and various entertainment options.\n\n2. Explore Central Park: Take a leisurely stroll or rent a bike to explore the beautiful landscapes, visit the Central Park Zoo, have a picnic, or even go horseback riding.\n\n3. Walk the High Line: This elevated park built on a historic freight rail line offers stunning views of the city skyline, beautiful gardens, art installations, and a unique perspective of NYC.\n\n4. Take a ferry to the Statue of Liberty: Visit the iconic Statue of Liberty on Liberty Island and enjoy breathtaking views of the city from the Crown or the pedestal. You can also explore Ellis Island's immigration museum nearby.\n\n5. Visit the Metropolitan Museum of Art: Explore the vast collections of art and artifacts from around the world at the Met and immerse yourself in the rich cultural history.\n\n6. Discover the vibrant neighborhoods: Explore the diverse neighborhoods of NYC, such as Chinatown, Little Italy, Greenwich Village, and Williamsburg. Enjoy authentic cuisine, unique shops, and immerse yourself in different cultures.\n\n7. Catch a Broadway show: Experience the magic of Broadway by watching a world-class performance at one of the many theaters in the Theater District.\n\n8. Walk across the Brooklyn Bridge: Enjoy panoramic views of the city as you walk or bike across the iconic Brooklyn Bridge, connecting Manhattan and Brooklyn.\n\n9. Explore the Museum of Modern Art (MoMA): Discover modern and contemporary art at MoMA, featuring masterpieces by artists like Van Gogh, Picasso, Warhol, and many more.\n\n10. Enjoy the food scene: NYC is a food lover's paradise. Indulge in diverse culinary experiences, from street food to Michelin-starred restaurants. Don't forget to try New York-style pizza, bagels, and the famous cronut."

