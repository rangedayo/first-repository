from __future__ import annotations

import os

import requests
import streamlit as st

DEFAULT_API = os.environ.get("INFERENCE_API_URL", "http://127.0.0.1:8000/predict")
DEFAULT_KEY = os.environ.get("INFERENCE_API_KEY", "test-key-001")

st.set_page_config(page_title="Plant disease inference", layout="centered")
st.title("Plant disease inference")
st.caption("Upload a leaf image. Calls the FastAPI backend with your API key.")

api_url = st.text_input("Predict URL", value=DEFAULT_API)
api_key = st.text_input("X-API-Key", value=DEFAULT_KEY, type="password")
uploaded = st.file_uploader("Image (JPEG/PNG)", type=["jpg", "jpeg", "png"])

if st.button("Predict") and uploaded is not None:
    files = {"file": (uploaded.name, uploaded.getvalue(), uploaded.type or "image/jpeg")}
    headers = {"X-API-Key": api_key}
    with st.spinner("Calling API…"):
        try:
            resp = requests.post(api_url, files=files, headers=headers, timeout=120)
        except requests.RequestException as e:
            st.error(f"Request failed: {e}")
        else:
            if resp.ok:
                data = resp.json()
                st.success(data.get("label", "unknown"))
                st.metric("Confidence", f"{float(data.get('confidence', 0)) * 100:.2f}%")
                v = data.get("state_dict_verification") or {}
                st.json(
                    {
                        "state_dict_verification": v,
                        "class_index": data.get("class_index"),
                    }
                )
            else:
                st.error(f"{resp.status_code}: {resp.text}")
