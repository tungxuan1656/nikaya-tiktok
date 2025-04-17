#!/bin/bash
node main.js
FILE_CONTENT="temp/content.txt"
PART=$(head -n 1 $FILE_CONTENT)
echo "PART: $PART"

ffmpeg -loop 1 -i "output/$PART/$PART.png" -i "output/$PART/$PART.m4a" -r 24 -pix_fmt yuv420p -c:v libx264 -c:a aac -ar 48000 -ac 1 -shortest -y "output/$PART/$PART.mp4"