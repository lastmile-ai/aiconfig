from aiconfig.schema import Prompt, PromptMetadata
from aiconfig.Config import AIConfigRuntime
from mock import patch
import openai
import pytest

from ..util.file_path_utils import get_absolute_file_path_from_relative

from ..conftest import set_temporary_env_vars, mock_openai_dalle_image_response


@pytest.mark.asyncio
async def test_serialize_basic(set_temporary_env_vars: None):
    # Test with one input prompt and system. No output
    completion_params = {
        "model": "dall-e-3",
        'n': 1,
        'prompt': 'Panda eating dumplings on a yellow mountain',
        'size': '1024x1024'
    }
    aiconfig = AIConfigRuntime.create()
    serialized_prompts = await aiconfig.serialize(
        "dall-e-3", completion_params, prompt_name="panda_eating_dumplings"
    )
    new_prompt = serialized_prompts[0]
    assert new_prompt == Prompt(
        name="panda_eating_dumplings",
        input="Panda eating dumplings on a yellow mountain",
        metadata=PromptMetadata(
            **{
                "model": {
                    "name": "dall-e-3",
                    "settings": {
                        'model': 'dall-e-3',
                        "n": 1,
                        "size": "1024x1024"
                    },
                },
            }
        ),
        outputs=[]
    )

@pytest.mark.asyncio
async def test_get_output_text(set_temporary_env_vars: None):
    with patch.object(openai.images, "generate", side_effect=mock_openai_dalle_image_response):
        config_relative_path = "../aiconfigs/basic_dalle3_config.json"
        config_absolute_path = get_absolute_file_path_from_relative(__file__, config_relative_path)
        aiconfig = AIConfigRuntime.load(config_absolute_path)

        await aiconfig.run("panda_eating_dumplings", {})

        output = aiconfig.get_output_text("panda_eating_dumplings")
        # Mock outputs stored in conftest
        assert (
            output
            == "1. Visit Times Square: Experience the bright lights and bustling atmosphere of this iconic NYC landmark. Enjoy shopping, dining, and various entertainment options.\n\n2. Explore Central Park: Take a leisurely stroll or rent a bike to explore the beautiful landscapes, visit the Central Park Zoo, have a picnic, or even go horseback riding.\n\n3. Walk the High Line: This elevated park built on a historic freight rail line offers stunning views of the city skyline, beautiful gardens, art installations, and a unique perspective of NYC.\n\n4. Take a ferry to the Statue of Liberty: Visit the iconic Statue of Liberty on Liberty Island and enjoy breathtaking views of the city from the Crown or the pedestal. You can also explore Ellis Island's immigration museum nearby.\n\n5. Visit the Metropolitan Museum of Art: Explore the vast collections of art and artifacts from around the world at the Met and immerse yourself in the rich cultural history.\n\n6. Discover the vibrant neighborhoods: Explore the diverse neighborhoods of NYC, such as Chinatown, Little Italy, Greenwich Village, and Williamsburg. Enjoy authentic cuisine, unique shops, and immerse yourself in different cultures.\n\n7. Catch a Broadway show: Experience the magic of Broadway by watching a world-class performance at one of the many theaters in the Theater District.\n\n8. Walk across the Brooklyn Bridge: Enjoy panoramic views of the city as you walk or bike across the iconic Brooklyn Bridge, connecting Manhattan and Brooklyn.\n\n9. Explore the Museum of Modern Art (MoMA): Discover modern and contemporary art at MoMA, featuring masterpieces by artists like Van Gogh, Picasso, Warhol, and many more.\n\n10. Enjoy the food scene: NYC is a food lover's paradise. Indulge in diverse culinary experiences, from street food to Michelin-starred restaurants. Don't forget to try New York-style pizza, bagels, and the famous cronut."
        )