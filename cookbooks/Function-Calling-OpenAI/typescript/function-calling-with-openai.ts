import { AIConfigRuntime, ExecuteResult, Prompt } from "aiconfig";
import { Chat } from "openai/resources";

const BOOKS_DB = [
  {
    id: "a1",
    name: "To Kill a Mockingbird",
    genre: "historical",
    description:
      'Compassionate, dramatic, and deeply moving, "To Kill A Mockingbird" takes readers to the roots of human behavior - to innocence and experience, kindness and cruelty, love and hatred, humor and pathos. Now with over 18 million copies in print and translated into forty languages, this regional story by a young Alabama woman claims universal appeal. Harper Lee always considered her book to be a simple love story. Today it is regarded as a masterpiece of American literature.',
  },
  {
    id: "a2",
    name: "All the Light We Cannot See",
    genre: "historical",
    description:
      "In a mining town in Germany, Werner Pfennig, an orphan, grows up with his younger sister, enchanted by a crude radio they find that brings them news and stories from places they have never seen or imagined. Werner becomes an expert at building and fixing these crucial new instruments and is enlisted to use his talent to track down the resistance. Deftly interweaving the lives of Marie-Laure and Werner, Doerr illuminates the ways, against all odds, people try to be good to one another.",
  },
  {
    id: "a3",
    name: "Where the Crawdads Sing",
    genre: "historical",
    description: `For years, rumors of the “Marsh Girl” haunted Barkley Cove, a quiet fishing village. Kya Clark is barefoot and wild; unfit for polite society. So in late 1969, when the popular Chase Andrews is found dead, locals immediately suspect her.\n\n\d
But Kya is not what they say. A born naturalist with just one day of school, she takes life\'s lessons from the land, learning the real ways of the world from the dishonest signals of fireflies. But while she has the skills to live in solitude forever, the time comes when she yearns to be touched and loved. Drawn to two young men from town, who are each intrigued by her wild beauty, Kya opens herself to a new and startling world—until the unthinkable happens.`,
  },
];

// Functions to interact with DB:

// The 'list' function returns a list of books in a specified genre.
function list(genre: string) {
  return BOOKS_DB.filter((book) => book.genre === genre);
}

// The 'search' function returns a list of books that match the provided name.
function search(name: string) {
  return BOOKS_DB.filter((book) => book.name === name);
}

// The 'get' function returns detailed information about a book based on its ID.
// Note: This function accepts only IDs, not names. Use the 'search' function to find a book's ID.
function get(id: string) {
  return BOOKS_DB.find((book) => book.id === id);
}

// Use helper function to executes the function specified by the LLM's output for 'function_call'.
// It handles 'list', 'search', or 'get' functions, and raises an Exception for unknown functions.
function callFunction(functionCall: string, arg: string) {
  switch (functionCall) {
    case "list":
      return list(arg);
    case "search":
      return search(arg);
    case "get":
      return get(arg);
    default:
      throw new Error(`Unknown function: ${functionCall}`);
  }
}

async function main() {
  // Create the config (note: could also be done via loading aiconfig json file)
  const config = AIConfigRuntime.create(
    "Book Finder",
    "Use OpenAI function calling to help recommend books"
  );

  const model = "gpt-3.5-turbo";
  const data = {
    model: model,
    messages: [
      {
        role: "system",
        content:
          "Please use our book database, which you can access using functions to answer the following questions.",
      },
      {
        role: "user",
        content:
          "I really enjoyed reading {{book}}, could you recommend me a book that is similar and tell me why?",
      },
    ],
    functions: [
      {
        name: "list",
        description:
          "list queries books by genre, and returns a list of names of books",
        parameters: {
          type: "object",
          properties: {
            genre: {
              type: "string",
              enum: [
                "mystery",
                "nonfiction",
                "memoir",
                "romance",
                "historical",
              ],
            },
          },
        },
      },
      {
        name: "search",
        description:
          "search queries books by their name and returns a list of book names and their ids",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
        },
      },
      {
        name: "get",
        description:
          "get returns a book's detailed information based on the id of the book. Note that this does not accept names, and only IDs, which you can get by using search.",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
            },
          },
        },
      },
    ],
  };

  // Add the prompt
  let newPrompts: Prompt[] = await config.serialize(
    model,
    data,
    "recommend_book",
    {
      book: "To Kill a Mockingbird",
    }
  );
  config.addPrompt(newPrompts[0]);

  const params = { book: "Where the Crawdads Sing" };
  const inferenceOptions = {
    stream: true,
    callbacks: {
      streamCallback: (
        data: Chat.Completions.ChatCompletionChunk.Choice.Delta,
        _accumulatedData: any,
        _index: any
      ) => {
        let text;
        if (data?.content) {
          text = data.content;
        } else if (data?.function_call) {
          if (data.function_call.name) {
            text = `${data.function_call.name}(`;
          } else if (data.function_call.arguments) {
            text = data.function_call.arguments;
          } else {
            text = `)`;
          }
        } else {
          text = "\n";
        }
        process.stdout.write(text);
      },
    },
  };

  // Run recommend_book prompt with gpt-3.5 and determine right function to call based on user question
  const completion = await config.run(
    "recommend_book",
    params,
    inferenceOptions
  );

  const output = (
    Array.isArray(completion) ? completion[0] : completion
  ) as ExecuteResult;

  const functionCall = (output.data as Chat.ChatCompletionAssistantMessageParam)
    .function_call;

  const value = callFunction(functionCall!.name, functionCall!.arguments);

  // Use GPT to generate a user-friendly response
  const promptData = {
    model: model,
    messages: [
      {
        role: "user",
        content:
          "Here is some data about a book from a books DB - please write a short description about the book as if you're a librarian. Data: {{book_info}}",
      },
    ],
  };

  newPrompts = await config.serialize(model, promptData, "gen_summary");
  config.addPrompt(newPrompts[0]);

  await config.run("gen_summary", { book_info: value }, inferenceOptions);
}

main();
