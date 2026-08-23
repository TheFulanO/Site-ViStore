
/* =========================================================
   VI STORE
   Frontend SPA + Supabase + Pedidos + Discord
   ========================================================= */


/* =========================
   SUPABASE
   ========================= */

const SUPABASE_URL =
  "https://paylmcyrotmzifnnjnnm.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_Jxllw5IIB6Ma5q6Qe8uTvw_3p4k81E1";

const sbReady =
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes("COLE_AQUI");

const supabaseClient =
  sbReady
    ? supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      )
    : null;


/* =========================
   PRODUTOS FALLBACK
   ========================= */

const demoProducts = [

  {
    id: "2feb4b29-e483-4aba-bd49-a94246054c23",
    name: "Jeep Cherokee Trackhawk",
    slug: "Jeep-Cherokee-Trackhawk",
    price: 20.00,
    platform: "MTA",
    category: "Cars",
    version: "2.0.0",
    featured: true,
    active: true,
    updated_at: "2026-08-22",

    image:
      "https://cdn.discordapp.com/attachments/1540871269938110574/1540871354138624071/maxresdefault-removebg-preview.png?ex=6a8b87c6&is=6a8a3646&hm=a765ad980b81341a1cf74485bad9cfe0f800882ada0311a96d39b71dd3c3a719&",

    cover_url:
      "https://cdn.discordapp.com/attachments/1540871269938110574/1540871354138624071/maxresdefault-removebg-preview.png?ex=6a8b87c6&is=6a8a3646&hm=a765ad980b81341a1cf74485bad9cfe0f800882ada0311a96d39b71dd3c3a719&",

    description:
      "Jeep Cherokee Trackhawk Otimizada E Convertida Para MTA.",

    features: [
      "Otimizado",
      "Modelo Detalhado",
      "Convertido E Refeito",
      "Compativel Com SA-MP"
 
    ]
  }

];


/* =========================
   ESTADO
   ========================= */

let products = [...demoProducts];


/* =========================
   CARRINHO
   ========================= */

let cart = [];

try {

  cart =
    JSON.parse(
      localStorage.getItem("vi_cart") || "[]"
    );

} catch {

  cart = [];

}


/*
 * IMPORTANTE:
 * Remove produtos antigos como:
 *
 * demo-1
 * demo-2
 * demo-3
 *
 * porque a tabela products usa UUID.
 */

cart =
  cart.filter(item =>
    item &&
    typeof item.id === "string" &&
    isUUID(item.id) &&
    Number(item.qty) > 0
  );


localStorage.setItem(
  "vi_cart",
  JSON.stringify(cart)
);


/* =========================
   FAVORITOS
   ========================= */

let favorites = [];

try {

  favorites =
    JSON.parse(
      localStorage.getItem("vi_favs") || "[]"
    );

} catch {

  favorites = [];

}


/* =========================
   USUÁRIO
   ========================= */

let currentUser = null;

let isAdmin = false;


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector) =>
  document.querySelector(selector);


function isUUID(value) {

  if (
    typeof value !== "string"
  ) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);

}


function money(number) {

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  ).format(
    Number(number) || 0
  );

}


function save() {

  localStorage.setItem(
    "vi_cart",
    JSON.stringify(cart)
  );

  localStorage.setItem(
    "vi_favs",
    JSON.stringify(favorites)
  );

  updateCounts();

}


function toast(message) {

  const root =
    $("#toast-root");

  if (!root) {

    alert(message);

    return;

  }


  const x =
    document.createElement("div");

  x.className =
    "toast";

  x.textContent =
    message;

  root.appendChild(x);


  setTimeout(
    () => x.remove(),
    3500
  );

}


function icon() {

  if (window.lucide) {

    lucide.createIcons();

  }

}


/* =========================================================
   CARREGAR PRODUTOS DO SUPABASE
   ========================================================= */

async function loadProducts() {

  if (!sbReady) {

    products =
      [...demoProducts];

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("products")
        .select(`
          id,
          name,
          slug,
          price,
          description,
          category_id,
          platform,
          version,
          featured,
          active,
          cover_url,
          gallery_urls,
          video_url,
          changelog,
          faq,
          features,
          created_at,
          updated_at,
          download_url
        `)
        .eq(
          "active",
          true
        );


    if (error) {

      console.error(
        "Erro ao carregar produtos:",
        error
      );

      products =
        [...demoProducts];

      return;

    }


    if (
      Array.isArray(data) &&
      data.length
    ) {

      products =
        data.map(p => ({

          ...p,

          /*
           * O frontend antigo usa image.
           * Agora pegamos cover_url do banco.
           */

          image:
            p.cover_url ||
            demoProducts.find(
              d => d.id === p.id
            )?.image ||
            "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=80",

          /*
           * O banco usa category_id.
           * Mantemos category para o frontend.
           */

          category:
            p.category_id || "Digital",

          features:
            Array.isArray(p.features)
              ? p.features
              : []

        }));

    } else {

      products =
        [...demoProducts];

    }


    /*
     * Remove do carrinho qualquer produto
     * que não exista mais no banco.
     */

    cart =
      cart.filter(item => {

        const exists =
          products.some(
            p => p.id === item.id
          );

        return exists &&
          isUUID(item.id);

      });


    save();


  } catch (error) {

    console.error(
      "Erro ao carregar produtos:",
      error
    );

    products =
      [...demoProducts];

  }

}


/* =========================================================
   CONTADORES
   ========================================================= */

function updateCounts() {

  const cartCount =
    $("#cart-count");

  const favCount =
    $("#fav-count");


  if (cartCount) {

    cartCount.textContent =
      cart.reduce(
        (total, item) =>
          total +
          Number(item.qty || 0),
        0
      );

  }


  if (favCount) {

    favCount.textContent =
      favorites.length;

  }


  const authSlot =
    $("#auth-slot");


  if (authSlot) {

    authSlot.innerHTML =
      currentUser

        ? `
          <button
            class="btn btn-ghost"
            onclick="location.hash='#account'"
          >
            ${
              (
                currentUser.user_metadata?.name ||
                currentUser.user_metadata?.username ||
                currentUser.email ||
                "Conta"
              )
              .split(" ")[0]
            }
            ▼
          </button>
        `

        : `
          <button
            class="btn btn-ghost"
            onclick="location.hash='#login'"
          >
            Entrar
          </button>
        `;

  }


  icon();

}


/* =========================================================
   CARD PRODUTO
   ========================================================= */

function productCard(p) {

  const fav =
    favorites.includes(p.id);


  return `

    <article class="product-card">

      <div class="product-cover">

        <img
          src="${p.image || p.cover_url || ""}"
          alt="${p.name}"
        >

        <span class="platform">
          ${p.platform || "Digital"}
        </span>

        <button
          class="fav ${fav ? "active" : ""}"
          onclick="toggleFav('${p.id}')"
          title="Favoritar"
        >

          <i data-lucide="heart"></i>

        </button>

      </div>


      <div class="product-body">

        <h3>
          ${p.name}
        </h3>

        <div class="muted">

          ${p.category || "Digital"}
          ·
          v${p.version || "1.0"}

        </div>


        <div class="price-row">

          <span class="price">
            ${money(p.price)}
          </span>


          <button
            class="mini-btn"
            onclick="location.hash='#product/${p.slug}'"
          >
            Ver produto
          </button>

        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   HOME
   ========================================================= */

function home() {

  const featured =
    products
      .filter(
        p => p.featured
      )
      .slice(0, 4);


  return `

    <section class="hero">

      <div class="hero-grid"></div>

      <div class="hero-content">

        <div class="eyebrow">

          <i
            data-lucide="sparkles"
            width="14"
          ></i>

          Vi Store · Digital Core

        </div>


        <h1>

          Scripts que elevam seu
          <span>servidor.</span>

        </h1>


        <p>

          Uma nova geração de recursos premium
          para MTA, FiveM, SA:MP e OpenMP.
          Tecnologia, performance e uma identidade
          visual feita para destacar seu RP.

        </p>


        <div class="hero-actions">

          <a
            class="btn btn-primary"
            href="#store"
          >
            Explorar produtos
          </a>


          <a
            class="btn btn-ghost"
            href="#login"
          >
            Entrar na conta
          </a>

        </div>

      </div>

    </section>


    <section class="section">

      <div class="section-head">

        <div>

          <h2>
            Em destaque
          </h2>

          <p>
            Os recursos que estão em alta
            na Vi Store.
          </p>

        </div>


        <a
          class="text-link"
          href="#store"
        >
          Ver tudo →
        </a>

      </div>


      <div class="product-grid">

        ${
          featured
            .map(productCard)
            .join("")
        }

      </div>

    </section>


    <section
      class="section"
      id="categories"
    >

      <div class="section-head">

        <div>

          <h2>
            Explore por categoria
          </h2>

          <p>
            Encontre exatamente o que
            seu servidor precisa.
          </p>

        </div>

      </div>


      <div class="categories">

        ${
          [
            "FiveM",
            "MTA",
            "SA:MP",
            "OpenMP"
          ]
          .map(
            (x, i) => `

              <a
                class="category"
                href="#store"
              >

                <i
                  data-lucide="${
                    [
                      "zap",
                      "layers",
                      "server",
                      "code-2"
                    ][i]
                  }"
                ></i>

                <h3>
                  ${x}
                </h3>

                <span>
                  Ver scripts compatíveis →
                </span>

              </a>

            `
          )
          .join("")
        }

      </div>

    </section>


    <section class="section">

      <div class="benefits">

        <div class="benefit">

          <i data-lucide="shield-check"></i>

          <h3>
            Entrega digital
          </h3>

          <p>
            Após a aprovação do pedido,
            seus arquivos ficam disponíveis
            na área de Downloads.
          </p>

        </div>


        <div class="benefit">

          <i data-lucide="sparkles"></i>

          <h3>
            Interface premium
          </h3>

          <p>
            Produtos pensados para combinar
            com servidores modernos.
          </p>

        </div>


        <div class="benefit">

          <i data-lucide="refresh-cw"></i>

          <h3>
            Atualizações
          </h3>

          <p>
            Acompanhe versões, changelogs
            e melhorias pela sua conta.
          </p>

        </div>

      </div>

    </section>

  `;

}


/* =========================================================
   LOJA
   ========================================================= */

function store() {

  return `

    <section class="section">

      <div class="section-head">

        <div>

          <h2>
            Loja
          </h2>

          <p>
            Scripts e sistemas digitais
            da Vi Store.
          </p>

        </div>

      </div>


      <div class="store-toolbar">

        <div class="search">

          <i
            data-lucide="search"
            width="18"
          ></i>

          <input
            id="search"
            class="input"
            placeholder="Buscar produto..."
            oninput="renderProducts()"
          >

        </div>


        <select
          id="platform"
          class="select"
          onchange="renderProducts()"
        >

          <option value="">
            Todas plataformas
          </option>

          <option>
            FiveM
          </option>

          <option>
            MTA
          </option>

          <option>
            SA:MP
          </option>

          <option>
            OpenMP
          </option>

        </select>


        <select
          id="sort"
          class="select"
          onchange="renderProducts()"
        >

          <option value="recent">
            Mais recentes
          </option>

          <option value="low">
            Menor preço
          </option>

          <option value="high">
            Maior preço
          </option>

          <option value="featured">
            Destaques
          </option>

        </select>

      </div>


      <div
        id="product-results"
        class="product-grid"
      ></div>

    </section>

  `;

}


function renderProducts() {

  const q =
    (
      $("#search")?.value ||
      ""
    )
    .toLowerCase();


  const platform =
    $("#platform")?.value ||
    "";


  const sort =
    $("#sort")?.value ||
    "recent";


  let arr =
    products.filter(
      p =>
        p.active !== false &&
        (!platform ||
          p.platform === platform) &&
        (
          !q ||
          `${p.name} ${p.category} ${p.platform}`
            .toLowerCase()
            .includes(q)
        )
    );


  arr.sort(
    (a, b) => {

      if (sort === "low")
        return (
          Number(a.price) -
          Number(b.price)
        );


      if (sort === "high")
        return (
          Number(b.price) -
          Number(a.price)
        );


      if (sort === "featured")
        return (
          Number(b.featured) -
          Number(a.featured)
        );


      return (
        new Date(
          b.updated_at ||
          b.created_at ||
          0
        ) -
        new Date(
          a.updated_at ||
          a.created_at ||
          0
        )
      );

    }
  );


  const results =
    $("#product-results");


  if (!results)
    return;


  results.innerHTML =
    arr.length

      ? arr
          .map(productCard)
          .join("")

      : `

        <div
          class="empty"
          style="grid-column:1/-1"
        >

          <i data-lucide="search-x"></i>

          <div>
            Nenhum produto encontrado.
          </div>

        </div>

      `;


  icon();

}


/* =========================================================
   PRODUTO
   ========================================================= */

function product(slug) {

  const p =
    products.find(
      x => x.slug === slug
    );


  if (!p)
    return notFound();


  const features =
    Array.isArray(p.features)
      ? p.features
      : [];


  return `

    <section class="detail">

      <div class="detail-top">

        <div class="gallery-main">

          <img
            src="${p.image || p.cover_url || ""}"
            alt="${p.name}"
          >

        </div>


        <div>

          <div class="detail-meta">

            <span class="tag">
              ${p.platform || "Digital"}
            </span>

            <span class="tag">
              ${p.category || "Digital"}
            </span>

            <span class="tag">
              v${p.version || "1.0"}
            </span>

          </div>


          <h1>
            ${p.name}
          </h1>


          <p class="detail-copy">
            ${p.description || ""}
          </p>


          <div class="detail-price">
            ${money(p.price)}
          </div>


          <button
            class="btn btn-primary"
            onclick="addCart('${p.id}')"
          >

            <i
              data-lucide="shopping-bag"
              width="16"
            ></i>

            Comprar agora

          </button>


          <button
            class="btn btn-ghost"
            onclick="toggleFav('${p.id}')"
          >

            <i
              data-lucide="heart"
              width="16"
            ></i>

            Favoritar

          </button>


          <div class="divider"></div>


          <div class="detail-copy">

            <b>
              Última atualização:
            </b>

            ${
              p.updated_at
                ? new Date(
                    p.updated_at
                  ).toLocaleDateString(
                    "pt-BR"
                  )
                : "—"
            }


            <br>


            <b>
              Compatibilidade:
            </b>

            ${p.platform || "—"}

            · versão

            ${p.version || "—"}

          </div>

        </div>

      </div>


      <div
        class="section"
        style="padding-left:0;padding-right:0"
      >

        <h2>
          Recursos
        </h2>


        <div class="benefits">

          ${
            features.length

              ? features
                  .map(
                    f => `

                      <div class="benefit">

                        <i data-lucide="check"></i>

                        <h3>
                          ${f}
                        </h3>

                        <p>
                          Incluído no pacote
                          deste produto.
                        </p>

                      </div>

                    `
                  )
                  .join("")

              : `

                <div class="benefit">

                  <i data-lucide="check"></i>

                  <h3>
                    Produto premium
                  </h3>

                  <p>
                    Recurso digital da Vi Store.
                  </p>

                </div>

              `
          }

        </div>


        <div class="divider"></div>


        <h2>
          Descrição
        </h2>


        <p class="detail-copy">

          ${p.description || ""}

        </p>


        <h2>
          Changelog & FAQ
        </h2>


        <p class="detail-copy">

          ${
            p.changelog ||
            `v${p.version || "1.0"} — produto disponível na Vi Store.`
          }

        </p>

      </div>

    </section>

  `;

}


/* =========================================================
   CARRINHO
   ========================================================= */

function cartPage() {

  /*
   * Limpa qualquer item inválido antes de mostrar.
   */

  cart =
    cart.filter(
      item =>
        isUUID(item.id) &&
        products.some(
          p => p.id === item.id
        )
    );


  save();


  if (!cart.length) {

    return `

      <section class="panel center">

        <i
          data-lucide="shopping-bag"
          width="42"
        ></i>


        <h1>
          Seu carrinho está vazio
        </h1>


        <p class="detail-copy">
          Escolha um produto premium
          para começar.
        </p>


        <a
          class="btn btn-primary"
          href="#store"
        >
          Ir para a loja
        </a>

      </section>

    `;

  }


  const items =
    cart
      .map(
        item => {

          const p =
            products.find(
              x => x.id === item.id
            );


          if (!p)
            return "";


          return `

            <div class="cart-item">

              <img
                src="${p.image || p.cover_url || ""}"
              >


              <div
                class="cart-item-main"
              >

                <b>
                  ${p.name}
                </b>


                <div class="muted">

                  ${money(p.price)}
                  · qtd. ${item.qty}

                </div>

              </div>


              <button
                class="mini-btn"
                onclick="removeCart('${p.id}')"
              >
                Remover
              </button>

            </div>

          `;

        }
      )
      .join("");


  const total =
    cart.reduce(
      (sum, item) => {

        const p =
          products.find(
            x => x.id === item.id
          );


        return (
          sum +
          (
            p
              ? Number(p.price) *
                Number(item.qty)
              : 0
          )
        );

      },
      0
    );


  return `

    <section class="panel wide">

      <h1>
        Carrinho
      </h1>


      <div class="cart-list">
        ${items}
      </div>


      <div class="cart-total">

        <span>
          Total
        </span>

        <span>
          ${money(total)}
        </span>

      </div>


      <div
        style="
          margin-top:20px;
          text-align:right
        "
      >

        <a
          class="btn btn-primary"
          href="#checkout"
        >
          Continuar para checkout
        </a>

      </div>

    </section>

  `;

}


/* =========================================================
   AUTENTICAÇÃO
   ========================================================= */

function authForm(mode) {

  const login =
    mode === "login";


  return `

    <section class="panel">

      <div class="center">

        <div class="eyebrow">
          ${login ? "Acesso" : "Nova conta"}
        </div>


        <h1>
          ${
            login
              ? "Entrar na Vi Store"
              : "Criar conta"
          }
        </h1>

      </div>


      <form
        class="form"
        onsubmit="
          submitAuth(event,'${mode}')
        "
      >

        ${
          !login

            ? `

              <div class="field">

                <label>
                  Nome
                </label>

                <input
                  class="input"
                  name="name"
                  required
                >

              </div>


              <div class="field">

                <label>
                  Usuário
                </label>

                <input
                  class="input"
                  name="username"
                  required
                >

              </div>

            `

            : ""
        }


        <div class="field">

          <label>
            Email
          </label>

          <input
            class="input"
            type="email"
            name="email"
            required
          >

        </div>


        <div class="field">

          <label>
            Senha
          </label>

          <input
            class="input"
            type="password"
            name="password"
            minlength="6"
            required
          >

        </div>


        ${
          login

            ? `

              <label class="muted">

                <input
                  type="checkbox"
                  name="remember"
                >

                Lembrar de mim

              </label>

            `

            : ""
        }


        <button
          class="btn btn-primary"
          type="submit"
        >

          ${
            login
              ? "Entrar"
              : "Criar conta"
          }

        </button>

      </form>


      <div class="divider"></div>


      <div class="center muted">

        ${
          login

            ? `
              Não possui conta?

              <a
                class="text-link"
                href="#register"
              >
                Cadastre-se
              </a>
            `

            : `
              Já possui conta?

              <a
                class="text-link"
                href="#login"
              >
                Entrar
              </a>
            `
        }

      </div>


      <div
        class="center"
        style="margin-top:14px"
      >

        <a
          class="muted"
          href="#forgot"
        >
          Esqueci minha senha
        </a>

      </div>

    </section>

  `;

}


async function submitAuth(e, mode) {

  e.preventDefault();


  if (!sbReady) {

    toast(
      "Configure corretamente o Supabase em app.js."
    );

    return;

  }


  const f =
    new FormData(e.target);


  try {

    if (mode === "login") {

      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signInWithPassword({

            email:
              f.get("email"),

            password:
              f.get("password")

          });


      if (error)
        throw error;


      currentUser =
        data.user;


      await loadProfile();


      location.hash =
        "#account";


      toast(
        "Login realizado com sucesso."
      );

    } else {

      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signUp({

            email:
              f.get("email"),

            password:
              f.get("password"),

            options: {

              data: {

                name:
                  f.get("name"),

                username:
                  f.get("username")

              }

            }

          });


      if (error)
        throw error;


      currentUser =
        data.user;


      toast(
        "Conta criada. Verifique seu email se necessário."
      );


      location.hash =
        "#account";

    }

  } catch (error) {

    console.error(
      "Erro de autenticação:",
      error
    );


    toast(
      error.message ||
      "Erro ao autenticar."
    );

  }

}


/* =========================================================
   PERFIL
   ========================================================= */

async function loadProfile() {

  if (
    !sbReady ||
    !currentUser
  )
    return;


  try {

    const {
      data
    } =
      await supabaseClient
        .from("profiles")
        .select("role")
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();


    isAdmin =
      data?.role === "admin";


  } catch (error) {

    console.error(
      "Erro ao carregar perfil:",
      error
    );


    isAdmin =
      false;

  }

}


/* =========================================================
   CONTA
   ========================================================= */

function account() {

  if (!currentUser) {

    return `

      <section class="panel center">

        <h1>
          Faça login
        </h1>

        <p class="detail-copy">
          Entre para acessar sua área
          do cliente.
        </p>


        <a
          class="btn btn-primary"
          href="#login"
        >
          Entrar
        </a>

      </section>

    `;

  }


  return `

    <section class="panel wide">

      <div class="section-head">

        <div>

          <h2>
            Olá,
            ${
              currentUser.user_metadata?.name ||
              currentUser.user_metadata?.username ||
              "Cliente"
            }
          </h2>


          <p>
            Conta criada em
            ${
              new Date(
                currentUser.created_at
              )
              .toLocaleDateString(
                "pt-BR"
              )
            }
          </p>

        </div>


        <button
          class="btn btn-ghost"
          onclick="logout()"
        >
          Sair
        </button>

      </div>


      <div class="stat-grid">

        <div class="stat">

          <small>
            Compras
          </small>

          <strong>
            0
          </strong>

        </div>


        <div class="stat">

          <small>
            Downloads
          </small>

          <strong>
            0
          </strong>

        </div>


        <div class="stat">

          <small>
            Favoritos
          </small>

          <strong>
            ${favorites.length}
          </strong>

        </div>


        <div class="stat">

          <small>
            Cadastro
          </small>

          <strong>
            ${
              new Date(
                currentUser.created_at
              )
              .toLocaleDateString(
                "pt-BR"
              )
            }
          </strong>

        </div>

      </div>


      <div class="divider"></div>


      <h3>
        Minha conta
      </h3>


      <div
        style="
          display:flex;
          gap:10px;
          flex-wrap:wrap
        "
      >

        <a
          class="btn btn-ghost"
          href="#downloads"
        >
          Downloads
        </a>


        <a
          class="btn btn-ghost"
          href="#history"
        >
          Histórico
        </a>


        <a
          class="btn btn-ghost"
          href="#favorites"
        >
          Favoritos
        </a>


        ${
          isAdmin

            ? `

              <a
                class="btn btn-primary"
                href="#admin"
              >
                Painel Admin
              </a>

            `

            : ""
        }

      </div>

    </section>

  `;

}


/* =========================================================
   LISTAS
   ========================================================= */

function simpleList(
  title,
  items,
  empty
) {

  return `

    <section class="panel wide">

      <div class="section-head">

        <div>

          <h2>
            ${title}
          </h2>

        </div>

      </div>


      ${
        items.length

          ? items.join("")

          : `

            <div class="empty">
              ${empty}
            </div>

          `
      }

    </section>

  `;

}


function favoritesPage() {

  return simpleList(

    "Favoritos",

    products
      .filter(
        p => favorites.includes(p.id)
      )
      .map(productCard),

    "Você ainda não favoritou nenhum produto."

  );

}


/* =========================================================
   CHECKOUT
   ========================================================= */

function checkout() {

  if (!currentUser) {

    return `

      <section class="panel center">

        <h1>
          Login obrigatório
        </h1>


        <p class="detail-copy">

          Entre na sua conta antes
          de finalizar a compra.

        </p>


        <a
          class="btn btn-primary"
          href="#login"
        >
          Entrar
        </a>

      </section>

    `;

  }


  if (!cart.length) {

    return `

      <section class="panel center">

        <h1>
          Carrinho vazio
        </h1>


        <a
          class="btn btn-primary"
          href="#store"
        >
          Ir para a loja
        </a>

      </section>

    `;

  }


  const total =
    cart.reduce(
      (sum, item) => {

        const p =
          products.find(
            x => x.id === item.id
          );


        return (
          sum +
          (
            p
              ? Number(p.price) *
                Number(item.qty)
              : 0
          )
        );

      },
      0
    );


  return `

    <section class="panel">

      <h1>
        Checkout
      </h1>


      <p class="detail-copy">

        Confirme seu pedido.
        Após finalizar, abra um ticket
        no Discord da Vi Store para
        receber as instruções de pagamento.

      </p>


      <div class="cart-total">

        <span>
          Total
        </span>

        <span>
          ${money(total)}
        </span>

      </div>


      <div class="divider"></div>


      <button
        id="finish-order-btn"
        class="btn btn-primary"
        style="
          width:100%;
          margin-top:12px
        "
        onclick="createOrder()"
      >

        Confirmar pedido

      </button>

    </section>

  `;

}


/* =========================================================
   CRIAR PEDIDO
   ========================================================= */

async function createOrder() {
  if (!currentUser) {
    toast("Você precisa estar logado.");
    location.hash = "#login";
    return;
  }

  if (!cart.length) {
    toast("Carrinho vazio.");
    return;
  }

  if (!sbReady) {
    toast("Supabase não está configurado.");
    return;
  }

  try {
    // =========================
    // CALCULAR TOTAL
    // =========================

    const total = cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.id);

      if (!product) {
        throw new Error(
          `Produto não encontrado: ${item.id}`
        );
      }

      return sum + Number(product.price) * Number(item.qty);
    }, 0);

    if (total <= 0) {
      throw new Error("Valor do pedido inválido.");
    }

    // =========================
    // CRIAR PEDIDO
    // =========================

    const {
      data: order,
      error: orderError
    } = await supabaseClient
      .from("orders")
      .insert({
        user_id: currentUser.id,
        total: total,
        status: "pending"
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    if (!order || !order.id) {
      throw new Error(
        "Pedido criado, mas o ID não foi retornado."
      );
    }

    console.log("Pedido criado:", order.id);

    // =========================
    // CRIAR ITENS
    // =========================

    const orderItems = cart.map(item => {
      const product = products.find(
        p => p.id === item.id
      );

      if (!product) {
        throw new Error(
          `Produto não encontrado: ${item.id}`
        );
      }

      return {
        order_id: order.id,
        product_id: product.id,
        quantity: Number(item.qty),
        unit_price: Number(product.price)
      };
    });

    const {
      error: itemsError
    } = await supabaseClient
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      throw itemsError;
    }

    console.log(
      "Itens do pedido criados:",
      orderItems
    );

    // =========================
    // ENVIAR PARA DISCORD
    // =========================

    console.log(
      "Chamando Edge Function discord-orders..."
    );

    const {
      data: discordData,
      error: discordError
    } = await supabaseClient.functions.invoke(
      "discord-orders",
      {
        body: {
          order_id: order.id,
          user_id: currentUser.id,
          total: total,
          status: "pending"
        }
      }
    );

    console.log(
      "Resposta da Edge Function:",
      discordData
    );

    if (discordError) {
      console.error(
        "Erro na Edge Function:",
        discordError
      );

      /*
       * IMPORTANTE:
       * O pedido já existe no banco.
       * Então não apagamos o pedido.
       */

      cart = [];
      save();

      toast(
        "Pedido criado, mas houve um problema ao enviar para o Discord."
      );

      location.hash = "#history";

      return;
    }

    // =========================
    // VERIFICAR RESPOSTA
    // =========================

    if (
      discordData &&
      discordData.success === false
    ) {
      console.error(
        "Discord não confirmou o envio:",
        discordData
      );

      cart = [];
      save();

      toast(
        "Pedido criado, mas o Discord recusou a notificação."
      );

      location.hash = "#history";

      return;
    }

    // =========================
    // SUCESSO
    // =========================

    console.log(
      "Pedido enviado para o Discord com sucesso!"
    );

    cart = [];
    save();

    toast(
      "Pedido criado com sucesso! Abra um ticket no Discord para solicitar a chave PIX."
    );

    location.hash = "#history";

  } catch (error) {

    console.error(
      "Erro ao finalizar pedido:",
      error
    );

    toast(
      error?.message ||
      "Não foi possível finalizar o pedido."
    );
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

  if (sbReady) {

    await supabaseClient
      .auth
      .signOut();

  }


  currentUser =
    null;

  isAdmin =
    false;


  updateCounts();


  location.hash =
    "#home";

}


/* =========================================================
   DOWNLOADS
   ========================================================= */

function downloads() {

  return simpleList(

    "Downloads",

    [],

    "Seus arquivos liberados aparecerão aqui após a aprovação do pagamento."

  );

}


/* =========================================================
   HISTÓRICO
   ========================================================= */

function history() {

  return `

    <section class="panel wide">

      <h1>
        Histórico
      </h1>


      <div class="empty">

        Nenhum pedido encontrado.

      </div>

    </section>

  `;

}


/* =========================================================
   ADMIN
   ========================================================= */

function admin() {

  if (
    !currentUser ||
    !isAdmin
  ) {

    return `

      <section class="panel center">

        <h1>
          Acesso restrito
        </h1>


        <p class="detail-copy">

          Somente usuários com role
          <b>admin</b>
          podem acessar este painel.

        </p>

      </section>

    `;

  }


  return `

    <section class="panel wide">

      <div class="section-head">

        <div>

          <h2>
            Painel Admin
          </h2>


          <p>
            Visão geral da operação.
          </p>

        </div>

      </div>


      <div class="stat-grid">

        <div class="stat">

          <small>
            Produtos
          </small>

          <strong>
            ${products.length}
          </strong>

        </div>


        <div class="stat">

          <small>
            Usuários
          </small>

          <strong>
            —
          </strong>

        </div>


        <div class="stat">

          <small>
            Pedidos
          </small>

          <strong>
            —
          </strong>

        </div>


        <div class="stat">

          <small>
            Receita
          </small>

          <strong>
            R$ —
          </strong>

        </div>

      </div>


      <div class="divider"></div>


      <h3>
        Produtos
      </h3>


      <div class="table-wrap">

        <table class="table">

          <thead>

            <tr>

              <th>
                Produto
              </th>

              <th>
                Plataforma
              </th>

              <th>
                Preço
              </th>

              <th>
                Status
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              products
                .map(
                  p => `

                    <tr>

                      <td>
                        ${p.name}
                      </td>

                      <td>
                        ${p.platform || "—"}
                      </td>

                      <td>
                        ${money(p.price)}
                      </td>

                      <td>
                        ${
                          p.active !== false
                            ? "Ativo"
                            : "Inativo"
                        }
                      </td>

                    </tr>

                  `
                )
                .join("")
            }

          </tbody>

        </table>

      </div>

    </section>

  `;

}


/* =========================================================
   FAVORITOS
   ========================================================= */

function toggleFav(id) {

  if (
    favorites.includes(id)
  ) {

    favorites =
      favorites.filter(
        x => x !== id
      );

  } else {

    favorites.push(id);

  }


  save();

  render();


  toast(

    favorites.includes(id)

      ? "Adicionado aos favoritos"

      : "Removido dos favoritos"

  );

}


/* =========================================================
   CARRINHO
   ========================================================= */

function addCart(id) {

  /*
   * Nunca permite colocar demo-1,
   * demo-2 etc. no carrinho.
   */

  if (!isUUID(id)) {

    toast(
      "Este produto possui um ID inválido."
    );

    console.error(
      "Tentativa de adicionar ID inválido:",
      id
    );

    return;

  }


  const product =
    products.find(
      p => p.id === id
    );


  if (!product) {

    toast(
      "Produto não encontrado."
    );

    return;

  }


  const item =
    cart.find(
      x => x.id === id
    );


  if (item) {

    item.qty =
      Number(item.qty) + 1;

  } else {

    cart.push({

      id:
        id,

      qty:
        1

    });

  }


  save();


  toast(
    "Produto adicionado ao carrinho"
  );


  location.hash =
    "#cart";

}


function removeCart(id) {

  cart =
    cart.filter(
      x => x.id !== id
    );


  save();

  render();

}


/* =========================================================
   AUTH BOOT
   ========================================================= */

async function bootAuth() {

  if (!sbReady)
    return;


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getUser();


    if (error) {

      console.warn(
        "getUser:",
        error.message
      );

    }


    if (data?.user) {

      currentUser =
        data.user;

      await loadProfile();

    }


    supabaseClient
      .auth
      .onAuthStateChange(
        async (_event, session) => {

          currentUser =
            session?.user ||
            null;


          if (currentUser) {

            await loadProfile();

          } else {

            isAdmin =
              false;

          }


          updateCounts();

        }
      );


  } catch (error) {

    console.error(
      "Erro ao iniciar autenticação:",
      error
    );

  }

}


/* =========================================================
   NOT FOUND
   ========================================================= */

function notFound() {

  return `

    <section class="panel center">

      <h1>
        Página não encontrada
      </h1>


      <a
        class="btn btn-primary"
        href="#home"
      >
        Voltar
      </a>

    </section>

  `;

}


/* =========================================================
   ROUTER
   ========================================================= */

function render() {

  const h =
    location.hash.slice(1) ||
    "home";


  const parts =
    h.split("/");


  const route =
    parts[0];


  let html;


  if (route === "home")
    html = home();


  else if (route === "store")
    html = store();


  else if (route === "product")
    html = product(parts[1]);


  else if (route === "categories")
    html = store();


  else if (route === "favorites")
    html = favoritesPage();


  else if (route === "cart")
    html = cartPage();


  else if (route === "checkout")
    html = checkout();


  else if (route === "login")
    html = authForm("login");


  else if (route === "register")
    html = authForm("register");


  else if (route === "forgot") {

    html = `

      <section class="panel">

        <h1>
          Recuperar senha
        </h1>


        <form
          class="form"
          onsubmit="
            event.preventDefault();
            toast('Link de recuperação enviado quando o Supabase estiver configurado.')
          "
        >

          <div class="field">

            <label>
              Email
            </label>


            <input
              class="input"
              type="email"
              required
            >

          </div>


          <button
            class="btn btn-primary"
          >
            Enviar link
          </button>

        </form>

      </section>

    `;

  }


  else if (route === "account")
    html = account();


  else if (route === "downloads")
    html = downloads();


  else if (route === "history")
    html = history();


  else if (route === "admin")
    html = admin();


  else
    html = notFound();


  const app =
    $("#app");


  if (app) {

    app.innerHTML =
      html;

  }


  updateCounts();

  icon();


  if (route === "store") {

    renderProducts();

  }

}


/* =========================================================
   EVENTOS
   ========================================================= */

window.addEventListener(
  "hashchange",
  render
);


window.addEventListener(
  "load",
  async () => {

    /*
     * Primeiro carrega os produtos reais.
     */

    await loadProducts();


    /*
     * Depois verifica autenticação.
     */

    await bootAuth();


    /*
     * Finalmente renderiza.
     */

    render();

  }
);


/* =========================================================
   SALVAR ESTADO
   ========================================================= */

save();

