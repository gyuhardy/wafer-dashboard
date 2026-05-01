#! /bin/sh

# 백엔드 먼저
cd wafer-dashboard/backend
pip install -r requirements.txt
uvicorn main:app --reload