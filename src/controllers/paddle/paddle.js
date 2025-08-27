// src/controllers/paddle/paddle.js

export const createPaddleProduct = async (req, res) => {

  

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { name, description } = req.body;

  

  try {
    const response = await fetch("https://sandbox-api.paddle.com/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      },
      body: JSON.stringify({
        name,
        description,
        tax_category: "standard",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create product");
    }

    return res.status(200).json({
      success: true,
      productId: data.data.id,
    });
  } catch (error) {
    console.error("Paddle Product API Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPaddlePrice = async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { productId, description, attributes, currency, type } = req.body;



  const PADDLE_BASE = "https://sandbox-api.paddle.com";
  const AUTH_HEADER = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
    Accept: "application/json",
  };

  const toCents = (v) => {
    // Avoid float issues like 19.9 * 100 = 1990.0000003
    return Math.round(Number(v) * 100);
  };

  const fetchJson = async (url, init) => {
    const resp = await fetch(url, init);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `Paddle request failed (${resp.status})`;
      const err = new Error(msg);
      err.status = resp.status;
      err.data = data;
      throw err;
    }
    return data;
  };

  const getPriceById = async (priceId) => {
    return fetchJson(`${PADDLE_BASE}/prices/${priceId}`, {
      method: "GET",
      headers: AUTH_HEADER,
    });
  };

  const listPricesByProduct = async (prodId, cursor = null, acc = []) => {
    // Paginates through all prices for this product
    const q = new URLSearchParams({ product_id: prodId });
    if (cursor) q.set("after", cursor);
    const data = await fetchJson(`${PADDLE_BASE}/prices?${q.toString()}`, {
      method: "GET",
      headers: AUTH_HEADER,
    });
    const items = Array.isArray(data?.data) ? data.data : [];
    const next = data?.meta?.pagination?.has_more
      ? data?.meta?.pagination?.end_cursor
      : null;
    const merged = acc.concat(items);
    return next ? listPricesByProduct(prodId, next, merged) : merged;
  };

  const amountsMatch = (paddlePrice, cents, curr) => {
    const unit = paddlePrice?.unit_price;
    // Paddle returns { amount: "1999", currency_code: "USD" }
    return (
      String(unit?.amount) === String(cents) &&
      String(unit?.currency_code).toUpperCase() === String(curr).toUpperCase()
    );
  };

  const createPrice = async ({
    prodId,
    desc,
    cents,
    curr,
    attributeKey,
    attrId,
  }) => {
    const payload = {
      product_id: prodId,
      description: desc,
      unit_price: {
        amount: String(cents),
        currency_code: curr,
      },
      custom_data: {
        attributeKey,
        id: attrId,
      },
    };

    const created = await fetchJson(`${PADDLE_BASE}/prices`, {
      method: "POST",
      headers: AUTH_HEADER,
      body: JSON.stringify(payload),
    });

    return created?.data;
  };

  try {
    if (type !== 'bundle' && (!productId || !attributes || typeof attributes !== "object")) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid payload. Require: productId, attributes (object).",
      });
    }

    const updatedAttributes = { ...attributes };

    if( type === 'bundle' ) {
        const { price, paddlePriceId } = req.body;
        if (!price || !productId) {
          return res.status(400).json({
            success: false,
            message: "Missing price or productId for bundle.",
          });
        }

        const cents = toCents(price);
        let finalPriceId = null;

        // 1) Check if we already have a price ID and if it's valid
        if (paddlePriceId) {
          try {
            const existing = await getPriceById(paddlePriceId);
            const priceData = existing?.data;
            if (
              priceData?.product_id === productId &&
              amountsMatch(priceData, cents, currency)
            ) {
              finalPriceId = priceData.id; // ✅ reuse existing price
            }
          } catch (e) {
            // Price ID is invalid or not found, will create new
          }
        }


        // 2) If no valid price, check if one already exists for this product & amount
        if (!finalPriceId) {
          try {
            const allPrices = await listPricesByProduct(productId);
            const found = allPrices.find((p) =>
              amountsMatch(p, cents, currency)
            );
            if (found) {
              finalPriceId = found.id; // ✅ reuse existing
            }
          } catch (e) {
            // Listing failed, fallback to create
          }
        }

         // 3) If still none, create a new price
        if (!finalPriceId) {
          const created = await createPrice({
            prodId: productId,
            desc: description,
            cents,
            curr: currency,
            attributeKey: "bundle",
            attrId: productId,
          });
          finalPriceId = created?.id;
          if (!finalPriceId) throw new Error("Failed to create new bundle price");
        }

        return res.status(200).json({
          success: true,
          paddlePriceId: finalPriceId,
        });

    }else{
      // Process attributes sequentially to avoid hammering the API.
      for (const [key, value] of Object.entries(attributes)) {
        const { costPrice, size, id: attributeId, paddlePriceId } = value || {};
        if (costPrice == null) {
          // Skip or fail — here we choose to fail fast for clarity.
          throw new Error(`Attribute "${key}" is missing costPrice`);
        }

        const cents = toCents(costPrice);
        const desc = `${description} - ${size ?? key}`;

        let finalPriceId = null;

        // 1) If we already have a priceId, verify it.
        if (paddlePriceId) {
          try {
            const existing = await getPriceById(paddlePriceId);
            const price = existing?.data;
            if (
              price?.product_id === productId &&
              amountsMatch(price, cents, currency)
            ) {
              finalPriceId = price.id; // ✅ reuse
            } else {
              // id exists but does not match; we will create a fresh price
            }
          } catch (e) {
            // Not found or invalid — fall through to lookup/create
          }
        }

        // 2) If we still don't have a match, try to find a reusable one by listing.
        if (!finalPriceId) {
          try {
            const all = await listPricesByProduct(productId);
            const found = all.find((p) => {
              const cd = p?.custom_data || {};
              const sameCustom =
                String(cd.attributeKey) === String(key) &&
                String(cd.id) === String(attributeId);
              return sameCustom && amountsMatch(p, cents, currency);
            });
            if (found) {
              finalPriceId = found.id; // ✅ reuse found existing
            }
          } catch (e) {
            // Listing failed; we'll just create a new one.
          }
        }

        // 3) If still none, create new.
        if (!finalPriceId) {
          const created = await createPrice({
            prodId: productId,
            desc,
            cents,
            curr: currency,
            attributeKey: key,
            attrId: attributeId,
          });
          finalPriceId = created?.id;
          if (!finalPriceId) throw new Error("Failed to obtain new price id");
        }

        // Save back
        updatedAttributes[key] = {
          ...value,
          paddlePriceId: finalPriceId,
        };
      }
    }

    return res.status(200).json({
      success: true,
      attributes: updatedAttributes,
    });
  } catch (error) {
    console.error("Paddle Price API Error:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};


export const getPaddleProduct = async (req, res) => {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { id } = req.params;

  try {
    const response = await fetch(`https://sandbox-api.paddle.com/products/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get product");
    }

    return res.status(200).json({
      success: true,
      product: data.data,
    });
  } catch (error) {
    console.error("Paddle Product API Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};