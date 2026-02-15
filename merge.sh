echo "Merging $1"
code --wait --merge "$1.local" "$1.other" "$1.base" "$1"
sl resolve --mark "$1"