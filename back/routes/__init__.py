from .user import user_routes
from .clientes import clientes_routes
from .receita import receita_routes
from .analise_margem import analise_margem_routes
from .analise import analise_margem_routes_xlsx
from .previsao_vendas import previsao_vendas_routes
from .upload_docs import upload_docs_routes
from .receitas_import import receitas_import_routes
from .curvaABCProduto import curva_abc_produto_routes
from .ticketMedio import ticket_medio_routes
from .toon import toon_routes
from .toonInsights import toon_insights_routes
from .gama import gama_routes
from .documentsRoutes import documents_routes
from .contabilidade import contabilidade_routes
from .client_cycle import client_cycle_routes
from .lt_clientes import lt_clientes_routes
from .ticket_medio_insights import ticket_medio_insights_routes




__all__ = [
    "user_routes",
    "clientes_routes",
    "receita_routes",
    "analise_margem_routes",
    "analise_margem_routes_xlsx",
    "previsao_vendas_routes",
    "upload_docs_routes",
    "receitas_import_routes",
    "curva_abc_produto_routes",
    "ticket_medio_routes",
    "toon_routes",
    "toon_insights_routes",
    "gama_routes",
    "documents_routes",
    "contabilidade_routes",
    "client_cycle_routes",
    "lt_clientes_routes",
    "lt_clientes_routeticket_medio_insights_routes",
]
