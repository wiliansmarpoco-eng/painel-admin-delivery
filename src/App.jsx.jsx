import { useEffect, useMemo, useState } from "react";

const API_URL = "https://delivery-saas-production-caba.up.railway.app";

export default function App() {
  const [logado, setLogado] = useState(false);
  const [empresa, setEmpresa] = useState(null);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [aba, setAba] = useState("estabelecimentos");
  const [abaProdutos, setAbaProdutos] = useState("produtos");

  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);

  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormularioProduto, setMostrarFormularioProduto] = useState(false);

  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: "",
    slug: "",
    telefone: "",
    email: "",
    senha: "",
    horario: "",
    categoria: "",
    logo_url: "",
    banner_url: "",
  });

  const [carregandoEmpresas, setCarregandoEmpresas] = useState(false);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [criandoEmpresa, setCriandoEmpresa] = useState(false);

  async function fazerLogin() {
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.erro || "Erro no login");

      setEmpresa(data.empresa);
      setLogado(true);
      localStorage.setItem("empresa_logada", JSON.stringify(data.empresa));
    } catch (error) {
      alert(error.message);
    }
  }

  function sair() {
    localStorage.removeItem("empresa_logada");
    setLogado(false);
    setEmpresa(null);
    setEmpresaSelecionada(null);
    setEmpresas([]);
    setProdutos([]);
    setPedidos([]);
    setEmail("");
    setSenha("");
    setAba("estabelecimentos");
  }

  async function carregarEmpresas() {
    if (empresa?.tipo !== "master") return;

    try {
      setCarregandoEmpresas(true);
      const res = await fetch(`${API_URL}/admin/empresas`);
      const data = await res.json();
      setEmpresas(data.empresas || []);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    } finally {
      setCarregandoEmpresas(false);
    }
  }

  async function carregarProdutos(slugAtual) {
    const slug = slugAtual || empresaSelecionada?.slug || empresa?.slug;
    if (!slug) return;

    try {
      setCarregandoProdutos(true);
      const res = await fetch(`${API_URL}/produtos/${slug}`);
      const data = await res.json();
      setProdutos(data.produtos || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setCarregandoProdutos(false);
    }
  }

  async function carregarPedidos(slugAtual) {
    const slug = slugAtual || empresaSelecionada?.slug || empresa?.slug;
    if (!slug) return;

    try {
      setCarregandoPedidos(true);
      const res = await fetch(`${API_URL}/admin/pedidos/${slug}`);
      const data = await res.json();
      setPedidos(data.pedidos || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setCarregandoPedidos(false);
    }
  }

  async function salvarProduto() {
    const slugAtual = empresa?.tipo === "master"
      ? empresaSelecionada?.slug
      : empresa?.slug;

    if (!slugAtual) {
      alert("Selecione um estabelecimento primeiro");
      return;
    }

    if (!nome || !preco) {
      alert("Preencha nome e preço");
      return;
    }

    try {
      const url = editandoId
        ? `${API_URL}/admin/produtos/${editandoId}`
        : `${API_URL}/admin/produtos/${slugAtual}`;

      const method = editandoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          preco: Number(preco),
          categoria: categoria || "Sem categoria",
          ativo: true,
          imagem_url: imagemUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.erro || "Erro ao salvar produto");

      limparFormulario();
      await carregarProdutos(slugAtual);
    } catch (error) {
      alert(error.message);
    }
  }

  async function deletarProduto(id) {
    const confirmar = confirm("Deseja excluir este produto?");
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_URL}/admin/produtos/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.erro || "Erro ao excluir produto");

      await carregarProdutos();
    } catch (error) {
      alert(error.message);
    }
  }

  function editarProduto(produto) {
    setEditandoId(produto.id);
    setNome(produto.nome || "");
    setPreco(produto.preco || "");
    setCategoria(produto.categoria || "");
    setImagemUrl(produto.imagem_url || "");
    setMostrarFormularioProduto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setPreco("");
    setCategoria("");
    setImagemUrl("");
    setMostrarFormularioProduto(false);
  }

  async function alterarStatusPedido(id, status) {
    try {
      const res = await fetch(`${API_URL}/admin/pedidos/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.erro || "Erro ao atualizar status");

      await carregarPedidos();
    } catch (error) {
      alert(error.message);
    }
  }

  async function criarEmpresa() {
    if (
      !novaEmpresa.nome ||
      !novaEmpresa.slug ||
      !novaEmpresa.telefone ||
      !novaEmpresa.email ||
      !novaEmpresa.senha
    ) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    try {
      setCriandoEmpresa(true);

      const res = await fetch(`${API_URL}/admin/empresas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaEmpresa),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.erro || "Erro ao criar empresa");

      alert("Estabelecimento criado com sucesso");

      setNovaEmpresa({
        nome: "",
        slug: "",
        telefone: "",
        email: "",
        senha: "",
        horario: "",
        categoria: "",
        logo_url: "",
        banner_url: "",
      });

      await carregarEmpresas();
    } catch (error) {
      alert(error.message);
    } finally {
      setCriandoEmpresa(false);
    }
  }

  function selecionarEstabelecimento(item) {
    setEmpresaSelecionada(item);
    setAba("produtos");
    carregarProdutos(item.slug);
    carregarPedidos(item.slug);
  }

  async function copiarLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copiado");
    } catch {
      alert("Não consegui copiar o link");
    }
  }

  function abrirQrCode(link) {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
    window.open(qr, "_blank");
  }

  useEffect(() => {
    const salvo = localStorage.getItem("empresa_logada");
    if (salvo) {
      const empresaSalva = JSON.parse(salvo);
      setEmpresa(empresaSalva);
      setLogado(true);
    }
  }, []);

  useEffect(() => {
    if (!empresa) return;

    if (empresa.tipo === "master") {
      carregarEmpresas();
    } else {
      setEmpresaSelecionada(empresa);
      carregarProdutos(empresa.slug);
      carregarPedidos(empresa.slug);
    }
  }, [empresa]);

  useEffect(() => {
    const slugAtual = empresa?.tipo === "master"
      ? empresaSelecionada?.slug
      : empresa?.slug;

    if (!slugAtual) return;

    const intervalo = setInterval(() => {
      carregarPedidos(slugAtual);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [empresa, empresaSelecionada]);

  const totalProdutos = produtos.length;
  const totalPedidos = pedidos.length;
  const pedidosPendentes = pedidos.filter(
    (p) => (p.status || "Pendente") === "Pendente"
  ).length;

  const faturamentoTotal = useMemo(() => {
    return pedidos.reduce((soma, p) => soma + Number(p.total || 0), 0);
  }, [pedidos]);

  const categoriasUnicas = useMemo(() => {
    const categorias = produtos.map((p) => p.categoria || "Sem categoria");
    return [...new Set(categorias)];
  }, [produtos]);

  const produtosPorCategoria = useMemo(() => {
    const grupos = {};
    produtos.forEach((produto) => {
      const cat = produto.categoria || "Sem categoria";
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(produto);
    });
    return grupos;
  }, [produtos]);

  function corStatus(status) {
    if (status === "Aceito") return "#2563eb";
    if (status === "Saiu para entrega") return "#f97316";
    if (status === "Entregue") return "#16a34a";
    return "#6b7280";
  }

  const nomePainel = empresa?.tipo === "master"
    ? empresaSelecionada?.nome || "Administrador do Sistema"
    : empresa?.nome;

  if (!logado) {
    return (
      <div style={loginPage}>
        <div style={loginCard}>
          <div style={loginTop}>
            <div style={logoCircle}>🛒</div>
            <h1 style={loginTitle}>Painel da Loja</h1>
            <p style={loginSubtitle}>Entre com o acesso do estabelecimento</p>
          </div>

          <div style={formGrid}>
            <input
              style={inputStyle}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button style={primaryButtonFull} onClick={fazerLogin}>
              Entrar no Painel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={shell}>
        <aside style={sidebar}>
          <div style={brandBox}>
            <div style={brandLogo}>PJ</div>
            <div>
              <div style={brandTitle}>PediJá</div>
              <div style={brandSub}>Painel do estabelecimento</div>
            </div>
          </div>

          <div style={storeMiniCard}>
            <div style={storeMiniTitle}>{nomePainel}</div>
            <div style={storeMiniSub}>{empresa?.email}</div>
            <div style={storeMiniType}>
              {empresa?.tipo === "master" ? "Administrador do sistema" : "Conta da loja"}
            </div>
          </div>

          <div style={menuList}>
            {empresa?.tipo === "master" && (
              <button
                onClick={() => setAba("estabelecimentos")}
                style={aba === "estabelecimentos" ? sideBtnActive : sideBtn}
              >
                Estabelecimentos
              </button>
            )}

            <button
              onClick={() => setAba("produtos")}
              style={aba === "produtos" ? sideBtnActive : sideBtn}
            >
              Produtos
            </button>

            <button
              onClick={() => setAba("pedidos")}
              style={aba === "pedidos" ? sideBtnActive : sideBtn}
            >
              Pedidos
            </button>
          </div>

          <button onClick={sair} style={logoutBtn}>
            Sair
          </button>
        </aside>

        <main style={main}>
          <div style={hero}>
            <div>
              <h1 style={heroTitle}>
                {aba === "estabelecimentos"
                  ? "Estabelecimentos"
                  : aba === "produtos"
                  ? "Produtos & Categorias"
                  : "Pedidos"}
              </h1>
              <p style={heroText}>
                {aba === "estabelecimentos"
                  ? "Gerencie seus pontos de venda"
                  : aba === "produtos"
                  ? "Gerencie seu cardápio"
                  : "Acompanhe e atualize os pedidos"}
              </p>
            </div>

            <div style={heroBadge}>
              Loja ativa: <strong>{nomePainel}</strong>
            </div>
          </div>

          <div style={statsGrid}>
            <div style={statCard}>
              <div style={statLabel}>Produtos</div>
              <div style={statValue}>{totalProdutos}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Pedidos</div>
              <div style={statValue}>{totalPedidos}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Pendentes</div>
              <div style={statValue}>{pedidosPendentes}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Faturamento</div>
              <div style={statValue}>R$ {faturamentoTotal.toFixed(2).replace(".", ",")}</div>
            </div>
          </div>

          {empresa?.tipo === "master" && aba === "estabelecimentos" && (
            <>
              <div style={card}>
                <h2 style={cardTitle}>Novo Estabelecimento</h2>
                <div style={formGrid}>
                  <input placeholder="Nome" value={novaEmpresa.nome} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })} style={inputStyle} />
                  <input placeholder="Slug" value={novaEmpresa.slug} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} style={inputStyle} />
                  <input placeholder="Telefone" value={novaEmpresa.telefone} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, telefone: e.target.value })} style={inputStyle} />
                  <input placeholder="Email" value={novaEmpresa.email} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, email: e.target.value })} style={inputStyle} />
                  <input placeholder="Senha" value={novaEmpresa.senha} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, senha: e.target.value })} style={inputStyle} />
                  <input placeholder="Horário (ex: 06:30 - 19:30)" value={novaEmpresa.horario} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, horario: e.target.value })} style={inputStyle} />
                  <input placeholder="Categoria (ex: Supermercado)" value={novaEmpresa.categoria} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, categoria: e.target.value })} style={inputStyle} />
                  <input placeholder="URL da logo" value={novaEmpresa.logo_url} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, logo_url: e.target.value })} style={inputStyle} />
                  <input placeholder="URL do banner" value={novaEmpresa.banner_url} onChange={(e) => setNovaEmpresa({ ...novaEmpresa, banner_url: e.target.value })} style={inputStyle} />

                  <button onClick={criarEmpresa} style={primaryButton} disabled={criandoEmpresa}>
                    {criandoEmpresa ? "Criando..." : "Criar Estabelecimento"}
                  </button>
                </div>
              </div>

              <div style={card}>
                <h2 style={cardTitle}>Lista de Estabelecimentos</h2>

                {carregandoEmpresas ? (
                  <p>Carregando estabelecimentos...</p>
                ) : empresas.length === 0 ? (
                  <p>Nenhum estabelecimento encontrado.</p>
                ) : (
                  <div style={gridList}>
                    {empresas
                      .filter((item) => item.tipo !== "master")
                      .map((item) => (
                        <div key={item.id} style={storeCard}>
                          <img
                            src={item.banner_url || "https://placehold.co/1200x220?text=Banner"}
                            alt={item.nome}
                            style={storeBanner}
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/1200x220?text=Banner";
                            }}
                          />

                          <div style={storeContent}>
                            <div style={storeHeader}>
                              <div style={storeLeft}>
                                <img
                                  src={item.logo_url || "https://placehold.co/70x70?text=Logo"}
                                  alt={item.nome}
                                  style={storeLogo}
                                  onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/70x70?text=Logo";
                                  }}
                                />

                                <div>
                                  <div style={storeName}>{item.nome}</div>
                                  <div style={storeCategory}>{item.categoria || "Sem categoria"}</div>
                                  <div style={storeMeta}>📞 {item.telefone}</div>
                                  <div style={storeMeta}>🕒 {item.horario || "Sem horário"}</div>
                                </div>
                              </div>

                              <div style={statusBox}>
                                <span style={item.aberta ? badgeGreen : badgeGray}>
                                  {item.aberta ? "Aberto" : "Fechado"}
                                </span>
                              </div>
                            </div>

                            <div style={storeButtons}>
                              <button onClick={() => selecionarEstabelecimento(item)} style={secondaryButton}>
                                Gerenciar
                              </button>
                              <button onClick={() => copiarLink(item.link_cardapio)} style={secondaryButton}>
                                Copiar Link
                              </button>
                              <a href={item.link_cardapio} target="_blank" rel="noreferrer" style={linkButton}>
                                Ver Cardápio
                              </a>
                              <button onClick={() => abrirQrCode(item.link_cardapio)} style={secondaryButton}>
                                QR Code
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}

          {aba === "produtos" && (
            <div style={card}>
              <h2 style={cardTitle}>Produtos & Categorias</h2>
              <p style={cardSubtitle}>Gerencie seu cardápio</p>

              <div style={tabsRow}>
                <button onClick={() => setAbaProdutos("produtos")} style={abaProdutos === "produtos" ? tabInlineActive : tabInline}>
                  Produtos
                </button>
                <button onClick={() => setAbaProdutos("categorias")} style={abaProdutos === "categorias" ? tabInlineActive : tabInline}>
                  Categorias
                </button>
              </div>

              <button
                onClick={() => {
                  setMostrarFormularioProduto(true);
                  setEditandoId(null);
                  setNome("");
                  setPreco("");
                  setCategoria("");
                  setImagemUrl("");
                }}
                style={newProductButton}
              >
                + Novo Produto
              </button>

              {mostrarFormularioProduto && (
                <div style={productFormCard}>
                  <h3 style={{ marginTop: 0 }}>
                    {editandoId ? "Editar Produto" : "Novo Produto"}
                  </h3>

                  <div style={formGrid}>
                    <input placeholder="Nome do produto" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
                    <input placeholder="Preço" type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} style={inputStyle} />
                    <input placeholder="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} style={inputStyle} />
                    <input placeholder="URL da foto do produto" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} style={inputStyle} />

                    {imagemUrl && (
                      <div style={previewBox}>
                        <img
                          src={imagemUrl}
                          alt="Preview"
                          style={previewImage}
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/120x120?text=Imagem";
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button onClick={salvarProduto} style={primaryButton}>
                        {editandoId ? "Salvar edição" : "Adicionar produto"}
                      </button>
                      <button onClick={limparFormulario} style={secondaryButton}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {abaProdutos === "produtos" && (
                <>
                  {carregandoProdutos ? (
                    <p>Carregando produtos...</p>
                  ) : produtos.length === 0 ? (
                    <p>Nenhum produto encontrado.</p>
                  ) : (
                    <div style={{ marginTop: "16px", display: "grid", gap: "18px" }}>
                      {Object.entries(produtosPorCategoria).map(([cat, lista]) => (
                        <div key={cat}>
                          <h3 style={categoryTitle}>{cat}</h3>
                          <div style={gridList}>
                            {lista.map((p) => (
                              <div key={p.id} style={productRowCard}>
                                <div style={productLeft}>
                                  <img
                                    src={p.imagem_url || "https://placehold.co/88x88?text=Produto"}
                                    alt={p.nome}
                                    style={productImage}
                                    onError={(e) => {
                                      e.currentTarget.src = "https://placehold.co/88x88?text=Produto";
                                    }}
                                  />
                                  <div>
                                    <div style={productName}>{p.nome}</div>
                                    <div style={productPrice}>R$ {Number(p.preco).toFixed(2).replace(".", ",")}</div>
                                    <div style={badgeRow}>
                                      <span style={badgeGreen}>Ativo</span>
                                      {Number(p.preco) < 10 && <span style={badgePromo}>🔥 Promoção</span>}
                                    </div>
                                  </div>
                                </div>

                                <div style={actionsRight}>
                                  <button onClick={() => editarProduto(p)} style={iconButton}>✏️</button>
                                  <button onClick={() => deletarProduto(p.id)} style={iconButtonDanger}>🗑️</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {abaProdutos === "categorias" && (
                <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
                  {categoriasUnicas.length === 0 ? (
                    <p>Nenhuma categoria encontrada.</p>
                  ) : (
                    categoriasUnicas.map((cat) => (
                      <div key={cat} style={categoryCard}>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "18px" }}>{cat}</div>
                          <div style={{ color: "#6b7280", marginTop: "4px" }}>
                            {produtosPorCategoria[cat]?.length || 0} produto(s)
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {aba === "pedidos" && (
            <div style={card}>
              <h2 style={cardTitle}>Pedidos</h2>

              {carregandoPedidos ? (
                <p>Carregando pedidos...</p>
              ) : pedidos.length === 0 ? (
                <p>Nenhum pedido encontrado.</p>
              ) : (
                <div style={gridList}>
                  {pedidos.map((pedido) => (
                    <div key={pedido.id} style={pedidoCard}>
                      <div style={pedidoHeader}>
                        <div style={pedidoNumero}>Pedido #{pedido.id}</div>
                        <span style={{ ...statusBadge, background: corStatus(pedido.status || "Pendente") }}>
                          {pedido.status || "Pendente"}
                        </span>
                      </div>

                      <div style={pedidoInfo}><strong>Cliente:</strong> {pedido.cliente_nome}</div>
                      <div style={pedidoInfo}><strong>WhatsApp:</strong> {pedido.whatsapp}</div>
                      <div style={pedidoInfo}><strong>Endereço:</strong> {pedido.endereco}</div>
                      <div style={pedidoTotal}>Total: R$ {Number(pedido.total).toFixed(2).replace(".", ",")}</div>

                      <div style={pedidoActions}>
                        <button onClick={() => alterarStatusPedido(pedido.id, "Pendente")} style={secondaryButtonSmall}>Pendente</button>
                        <button onClick={() => alterarStatusPedido(pedido.id, "Aceito")} style={blueButtonSmall}>Aceito</button>
                        <button onClick={() => alterarStatusPedido(pedido.id, "Saiu para entrega")} style={orangeButtonSmall}>Envio</button>
                        <button onClick={() => alterarStatusPedido(pedido.id, "Entregue")} style={greenButtonSmall}>Entregue</button>
                        <a href={`https://wa.me/55${pedido.whatsapp}`} target="_blank" rel="noreferrer" style={whatsButton}>
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#eef2f7",
  fontFamily: "Arial, sans-serif",
};

const shell = {
  display: "grid",
  gridTemplateColumns: "280px 1fr",
  minHeight: "100vh",
};

const sidebar = {
  background: "#111827",
  color: "#fff",
  padding: "22px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const brandBox = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingBottom: "10px",
};

const brandLogo = {
  width: "46px",
  height: "46px",
  borderRadius: "14px",
  background: "#f97316",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: "18px",
};

const brandTitle = {
  fontSize: "24px",
  fontWeight: "bold",
};

const brandSub = {
  fontSize: "13px",
  color: "#cbd5e1",
};

const storeMiniCard = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "14px",
};

const storeMiniTitle = {
  fontWeight: "bold",
  marginBottom: "4px",
  fontSize: "16px",
};

const storeMiniSub = {
  fontSize: "13px",
  color: "#cbd5e1",
  wordBreak: "break-word",
};

const storeMiniType = {
  marginTop: "8px",
  fontSize: "12px",
  color: "#fbbf24",
  fontWeight: "bold",
};

const menuList = {
  display: "grid",
  gap: "10px",
};

const sideBtn = {
  background: "transparent",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "12px 14px",
  borderRadius: "12px",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: "bold",
};

const sideBtnActive = {
  ...sideBtn,
  background: "#f97316",
  color: "#fff",
  border: "1px solid #f97316",
};

const logoutBtn = {
  marginTop: "auto",
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "12px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const main = {
  padding: "28px",
};

const hero = {
  background: "linear-gradient(135deg, #ffedd5, #ffffff)",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
};

const heroTitle = {
  margin: 0,
  fontSize: "34px",
  color: "#111827",
};

const heroText = {
  margin: "8px 0 0",
  color: "#6b7280",
};

const heroBadge = {
  background: "#fff",
  border: "1px solid #fed7aa",
  borderRadius: "14px",
  padding: "12px 16px",
  color: "#9a3412",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const statCard = {
  background: "#fff",
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const statLabel = {
  color: "#6b7280",
  marginBottom: "8px",
  fontSize: "14px",
};

const statValue = {
  fontWeight: "bold",
  fontSize: "28px",
  color: "#111827",
};

const card = {
  background: "#fff",
  borderRadius: "22px",
  padding: "22px",
  marginBottom: "22px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
};

const cardTitle = {
  marginTop: 0,
  marginBottom: "8px",
  fontSize: "28px",
};

const cardSubtitle = {
  marginTop: 0,
  color: "#6b7280",
  marginBottom: "18px",
};

const formGrid = {
  display: "grid",
  gap: "12px",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  outline: "none",
};

const primaryButton = {
  background: "#f97316",
  color: "#fff",
  border: "none",
  padding: "13px 18px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "bold",
};

const primaryButtonFull = {
  ...primaryButton,
  width: "100%",
};

const secondaryButton = {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  padding: "12px 16px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const tabsRow = {
  display: "flex",
  gap: "10px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const tabInline = {
  background: "#fff",
  color: "#374151",
  border: "1px solid #e5e7eb",
  padding: "10px 18px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const tabInlineActive = {
  ...tabInline,
  boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
  color: "#111827",
};

const newProductButton = {
  background: "#f97316",
  color: "#fff",
  border: "none",
  padding: "14px 20px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
  marginBottom: "18px",
};

const productFormCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  marginBottom: "12px",
  background: "#fafafa",
};

const previewBox = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const previewImage = {
  width: "120px",
  height: "120px",
  borderRadius: "16px",
  objectFit: "cover",
  border: "1px solid #e5e7eb",
};

const categoryTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "12px",
  color: "#111827",
};

const gridList = {
  display: "grid",
  gap: "14px",
};

const productRowCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const productLeft = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const productImage = {
  width: "88px",
  height: "88px",
  borderRadius: "16px",
  objectFit: "cover",
  background: "#f3f4f6",
  border: "1px solid #e5e7eb",
};

const productName = {
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "6px",
};

const productPrice = {
  color: "#f97316",
  fontWeight: "bold",
  fontSize: "18px",
};

const badgeRow = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "8px",
};

const badgeGreen = {
  background: "#dcfce7",
  color: "#166534",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: "bold",
  fontSize: "12px",
};

const badgeGray = {
  background: "#e5e7eb",
  color: "#374151",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: "bold",
  fontSize: "12px",
};

const badgePromo = {
  background: "#fff7ed",
  color: "#c2410c",
  padding: "6px 10px",
  borderRadius: "999px",
  fontWeight: "bold",
  fontSize: "12px",
};

const actionsRight = {
  display: "flex",
  gap: "10px",
};

const iconButton = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "12px",
  cursor: "pointer",
  fontSize: "18px",
};

const iconButtonDanger = {
  ...iconButton,
  color: "#dc2626",
};

const categoryCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  background: "#fafafa",
};

const pedidoCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
  display: "grid",
  gap: "10px",
};

const pedidoHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const pedidoNumero = {
  fontSize: "22px",
  fontWeight: "bold",
};

const pedidoInfo = {
  color: "#374151",
};

const pedidoTotal = {
  color: "#f97316",
  fontWeight: "bold",
  fontSize: "18px",
};

const pedidoActions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "8px",
};

const statusBadge = {
  color: "#fff",
  padding: "6px 12px",
  borderRadius: "999px",
  fontWeight: "bold",
  fontSize: "13px",
};

const secondaryButtonSmall = {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const blueButtonSmall = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const orangeButtonSmall = {
  background: "#f97316",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const greenButtonSmall = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const whatsButton = {
  background: "#25D366",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-flex",
  alignItems: "center",
};

const loginPage = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #fff7ed, #f3f4f6)",
  fontFamily: "Arial, sans-serif",
  padding: "20px",
};

const loginCard = {
  width: "100%",
  maxWidth: "430px",
  background: "#fff",
  padding: "34px",
  borderRadius: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const loginTop = {
  textAlign: "center",
  marginBottom: "20px",
};

const logoCircle = {
  width: "72px",
  height: "72px",
  margin: "0 auto 16px",
  borderRadius: "22px",
  background: "linear-gradient(135deg, #f97316, #fb923c)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "34px",
};

const loginTitle = {
  margin: 0,
  fontSize: "42px",
};

const loginSubtitle = {
  marginTop: "10px",
  color: "#6b7280",
};

const storeCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  overflow: "hidden",
  background: "#fff",
  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
};

const storeBanner = {
  width: "100%",
  height: "180px",
  objectFit: "cover",
  background: "#f3f4f6",
};

const storeContent = {
  padding: "18px",
};

const storeHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
};

const storeLeft = {
  display: "flex",
  gap: "14px",
  alignItems: "flex-start",
};

const storeLogo = {
  width: "70px",
  height: "70px",
  borderRadius: "16px",
  objectFit: "cover",
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
};

const storeName = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#111827",
};

const storeCategory = {
  color: "#6b7280",
  marginTop: "4px",
  marginBottom: "10px",
};

const storeMeta = {
  color: "#374151",
  marginTop: "4px",
};

const statusBox = {
  display: "flex",
  alignItems: "flex-start",
};

const storeButtons = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const linkButton = {
  background: "#fff7ed",
  color: "#c2410c",
  border: "1px solid #fdba74",
  padding: "12px 16px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: "bold",
};
