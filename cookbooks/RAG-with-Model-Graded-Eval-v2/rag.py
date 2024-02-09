import argparse
import asyncio
import sys
from aiconfig import AIConfigRuntime
import chromadb
from glob import glob


import os

dir_path = os.path.dirname(os.path.realpath(__file__))


def chunk_markdown(text, chunk_size=1000):
    chunks = []
    for i in range(0, len(text), chunk_size):
        yield text[i : i + chunk_size]
    return chunks


async def run_ingest(directory, collection_name):
    chroma_client = chromadb.PersistentClient(path="chroma_2.db")
    collection = chroma_client.create_collection(name=collection_name)

    for i, filename in enumerate(glob(f"{directory}/**/*", recursive=True)):
        print("Ingesting:", i, filename)
        documents = []
        metadatas = []
        ids = []

        with open(filename, "r") as f:
            data = f.read()
            for j, chunk in enumerate(chunk_markdown(data)):
                documents.append(chunk)
                metadatas.append({"source": filename})
                ids.append(f"doc_{i}_chunk{j}")

        collection.add(documents=documents, metadatas=metadatas, ids=ids)


def retrieve_data(collection, query, k):
    print("Querying for:", query)
    context = collection.query(query_texts=[query], n_results=k)
    return context


def serialize_retrieved_data(data):
    # print("Serializing data:", type(data), data)
    return "\n".join(f"{k}={v}" for k, v in data.items())


async def generate(query, context):
    aiconfig_path = os.path.join(dir_path, "rag.aiconfig.yaml")
    config = AIConfigRuntime.load(aiconfig_path)
    params = {"query": query, "context": context}
    # print("Running generate with params:", params)
    return await config.run_and_get_output_text(
        "generate_baseline", params=params
    )


async def run_evals(query, context, answer):
    aiconfig_path = os.path.join(dir_path, "rag.aiconfig.yaml")
    config = AIConfigRuntime.load(aiconfig_path)
    return [
        await config.run_and_get_output_text(
            f"evaluate_{criterion}",
            params={
                "query": query,
                "context": context,
                "answer": answer,
            },
        )
        for criterion in ["relevance", "faithfulness_baseline", "coherence"]
    ]


async def run_query(query, collection_name, k):
    chroma_client = chromadb.PersistentClient(path="chroma_2.db")
    collection = chroma_client.get_collection(name=collection_name)
    data = retrieve_data(collection, query, k)
    print("Retrieved data:\n", "\n".join(data["documents"][0]))
    context = serialize_retrieved_data(data)
    result = await generate(query, context)
    print("\n\nResponse:\n", result)

    print("\n\nEvaluating...")
    evals = await run_evals(query, context, result)
    print("Evaluations:")
    for criterion, score in zip(
        ["relevance", "faithfulness_baseline", "coherence"], evals
    ):
        print(f"{criterion}: {score}")


def info():
    print("Starting info")
    chroma_client = chromadb.PersistentClient(path="chroma_2.db")
    collections = chroma_client.list_collections()
    print("Available Chroma Collections:", collections)


async def main():
    parser = argparse.ArgumentParser(description="RAG demo")
    subparsers = parser.add_subparsers(dest="command")

    ingest_parser = subparsers.add_parser("ingest", help="Ingest data")
    ingest_parser.add_argument("directory", help="Directory to ingest")
    ingest_parser.add_argument(
        "--chroma-collection-name",
        help="Name of the collection",
        default="10ks_v4",
    )

    query_parser = subparsers.add_parser("query", help="Run a query")
    query_parser.add_argument("input_query", help="input query to run")
    query_parser.add_argument(
        "--chroma-collection-name",
        help="Name of the collection",
        default="10ks_v4",
    )
    query_parser.add_argument("-k", type=int, default=100)

    info_parser = subparsers.add_parser("info")

    args = parser.parse_args()

    if args.command == "ingest":
        await run_ingest(args.directory, args.chroma_collection_name)
    elif args.command == "query":
        await run_query(args.input_query, args.chroma_collection_name, args.k)
    elif args.command == "info":
        info()
    else:
        parser.print_help()

    return 0


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(result)
