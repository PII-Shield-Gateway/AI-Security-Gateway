from flask import Flask

from .config import Config
from .routes.gateway import gateway_blueprint
from .services.external_api import ExternalApiClient
from .services.logging_service import init_gateway_logger


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    init_gateway_logger(app)
    app.extensions["external_api_client"] = ExternalApiClient(app.config)
    app.register_blueprint(gateway_blueprint)

    @app.get("/health")
    def health() -> tuple[dict, int]:
        return {"status": "ok"}, 200

    return app
