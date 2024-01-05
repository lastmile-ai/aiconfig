import os


def get_absolute_file_path_from_relative(working_file_path: str, relative_file_path: str) -> str:
    """
    Returns the absolute file path of a file given its relative file path and the file path of the calling file.

    Args:
        working_file_path (str): The file path of the calling file.
        relative_file_path (str): The relative file path of the file.

    Returns:
        str: The absolute file path of the target file.
    """
    current_file_path = os.path.dirname(os.path.abspath(working_file_path))
    absolute_file_path = os.path.join(current_file_path, relative_file_path)
    return absolute_file_path
