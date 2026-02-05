import torch
import torch.nn as nn

class ImprovedDnCNN(nn.Module):
    def __init__(self, channels=3, features=96, layers=22):
        super().__init__()
        net = [
            nn.Conv2d(channels, features, 3, padding=1),
            nn.ReLU(inplace=True)
        ]

        for _ in range(layers - 2):
            net += [
                nn.Conv2d(features, features, 3, padding=1),
                nn.BatchNorm2d(features),
                nn.ReLU(inplace=True)
            ]

        net.append(nn.Conv2d(features, channels, 3, padding=1))
        self.net = nn.Sequential(*net)

    def forward(self, x):
        noise = self.net(x)
        return x - noise
