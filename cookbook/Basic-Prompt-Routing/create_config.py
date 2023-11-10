from aiconfig import AIConfigRuntime
from aiconfig import Prompt

aiconfig = AIConfigRuntime.create("assistant_config", "teaching assistant config")

# Set GPT-4 as default model from Teaching Assistant prompts
model_name = "gpt-4"
model_settings = {
    "top_k": 40,
    "top_p":1,
    "model": "gpt-4",
    "temperature": 0.0
}
aiconfig.add_model(model_name, model_settings)


# Router Prompt
router_prompt = Prompt(
    name="router",
    input="{{student_question}}",
    metadata= {
        "model":{ 
            "name": "gpt-4", 
            "settings":{
                "system_prompt":"""
                    You will be given a question. Classify the question as one of the following topics: 
                        1. Math
                        2. Physics
                        3. General
                    Output the topic name.
                """
            }
        },
    }
)
aiconfig.add_prompt("router_prompt", router_prompt)

# Math Assistant Prompt
math_assistant = Prompt(
    name="math",
    input="""
        Student Question: {{router.input}}
        Topic: {{router.output}}
    """,
    metadata= {
        "model":{ 
            "name": "gpt-4", 
            "settings":{
                "system_prompt":"""
                    You are a very good mathematician. You are great at answering math questions. 
                    You are so good because you are able to break down hard problems into their component parts, 
                    answer the component parts, and then put them together to answer the broader question.
                    
                    Output: If topic is Math, introduce yourself as 'Hi! I'm your Math Professor' and then answer the question. 
                    If the topic is not Math, output 'Sorry I only answer Math questions'.
                """
            }
        },
    }
)
aiconfig.add_prompt("math", math_assistant)

# Physics Assistant Prompt
physics_assistant = Prompt(
    name="physics",
    input="""
        Student Question: {{router.input}}
        Topic: {{router.output}}
    """,
    metadata= {
        "model":{ 
            "name": "gpt-4", 
            "settings":{
                "system_prompt":"""
                    You are a very smart physics professor. You are great at answering questions about physics in a concise and easy
                    to understand manner. When you don't know the answer to a question you admit that you don't know.
                    
                    Output: If topic is Physics, introduce yourself as 'Hi! I'm your Physics Professor' and then answer the question. 
                    If the topic is not Physics, output 'Sorry I only answer Physics questions'.
                """
            }
        },
    }
)
aiconfig.add_prompt("physics", physics_assistant)


# General Assistant Prompt
general_assistant = Prompt(
    name="general",
    input="""
        Student Question: {{router.input}}
        Topic: {{router.output}}
    """,
    metadata= {
        "model":{ 
            "name": "gpt-4", 
            "settings":{
                "system_prompt":"""
                    You are a helpful assistant. Answer the question as accurately as you can. 
                    
                    Introduce yourself as "Hi I'm your general assistant". Then answer the question. 
                """
            }
        },
    }
)
aiconfig.add_prompt("general", general_assistant)

# Save AIConfig
aiconfig.save('assistant_aiconfig.json', include_outputs=False)