from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from model import ImprovedDnCNN
import torch
from PIL import Image
import io
import torchvision.transforms.functional as TF

# --- App setup ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Device ---
device = torch.device("cpu")  # Free hosting usually has no GPU

# --- Load model ---
model = ImprovedDnCNN()
model.load_state_dict(torch.load("dncnn_color.pth", map_location=device))
model.to(device)
model.eval()

# --- Endpoint ---
@app.post("/denoise")
async def denoise(file: UploadFile = File(...)):
    try:
        # Read uploaded image
        img_bytes = await file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Resize if image is too big (prevent crashes)
        max_dim = 512
        if max(img.size) > max_dim:
            img.thumbnail((max_dim, max_dim))

        # Convert to tensor and add batch
        input_tensor = TF.to_tensor(img).unsqueeze(0).to(device)

        # Inference
        with torch.no_grad():
            output_tensor = model(input_tensor)

        # Convert tensor to PIL image
        output_img = TF.to_pil_image(output_tensor.squeeze(0).cpu())
        buf = io.BytesIO()
        output_img.save(buf, format="PNG")
        buf.seek(0)

        return StreamingResponse(buf, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
