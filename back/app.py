from flask import Flask
from flask_cors import CORS

from routes import (
    user_routes,
    clientes_routes,
    receita_routes,
    analise_margem_routes,
    previsao_vendas_routes,
    upload_docs_routes,
    receitas_import_routes,
    curva_abc_produto_routes,
    ticket_medio_routes,
    toon_routes,
    toon_insights_routes,
    analise_margem_routes_xlsx,
    gama_routes,
    documents_routes,
    contabilidade_routes,
    client_cycle_routes,
    lt_clientes_routes,
    ticket_medio_insights_routes,
    dashcliente_routes,
)

app = Flask(__name__)

# =====================================================
# CORS - DESENVOLVIMENTO (LIBERA TUDO)
# =====================================================
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True,
)

# =====================================================
# CORS - PRODUÇÃO (EXEMPLO RESTRITO - ATIVAR DEPOIS)
# =====================================================
# CORS(
#     app,
#     resources={
#         r"/users/login": {"origins": ["https://app.seudominio.com"]},
#         r"/users/register": {"origins": ["https://app.seudominio.com"]},
#         r"/receitas/*": {"origins": ["https://app.seudominio.com"]},
#     },
#     supports_credentials=True,
# )

# =====================================================
# ROTAS
# =====================================================
app.register_blueprint(user_routes)
app.register_blueprint(clientes_routes)
app.register_blueprint(receita_routes)
app.register_blueprint(analise_margem_routes)
app.register_blueprint(analise_margem_routes_xlsx)
app.register_blueprint(previsao_vendas_routes)
app.register_blueprint(upload_docs_routes)
app.register_blueprint(receitas_import_routes)
app.register_blueprint(curva_abc_produto_routes)
app.register_blueprint(ticket_medio_routes)
app.register_blueprint(toon_routes)
app.register_blueprint(toon_insights_routes)
app.register_blueprint(gama_routes)
app.register_blueprint(documents_routes)
app.register_blueprint(contabilidade_routes)
app.register_blueprint(client_cycle_routes)
app.register_blueprint(lt_clientes_routes)
app.register_blueprint(ticket_medio_insights_routes)
app.register_blueprint(dashcliente_routes)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
