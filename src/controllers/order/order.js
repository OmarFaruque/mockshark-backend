// import pkg from "sslcommerz-lts";
// import dotenv from "dotenv";
import SSLCommerzPayment from "sslcommerz-lts";
import { defaultLimit, defaultPage } from "../../utils/defaultData.js";
import sendEmail from "../../utils/emailService.js";
import jsonResponse from "../../utils/jsonResponse.js";
import prisma from "../../utils/prismaClient.js";
import validateInput from "../../utils/validateInput.js";
import axios from "axios";
// adjust based on your structure
// dotenv.config();

const module_name = "order";

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false; //true for live, false for sandbox

//create order
export const createOrder = async (req, res) => {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const {
          userId,
          couponId,
          // customerName,
          // customerPhone,
          // customerAddress,
          // customerBillingAddress,
          // customerEmail,
          // customerCity,
          // customerPostalCode,
          invoiceNumber,
          // paymentMethod,
          // deliveryChargeInside,
          // deliveryChargeOutside,
          // // totalItems,
          // // subtotalCost,
          // // subtotal,
          billingFirstName,
          billingLastName,
          billingCompany,
          billingCountry,
          billingEmail,
          billingPhone,
          address,
          apartment,
          city,
          state,
          postalCode,
          orderItems,
          subtotalCost,
        } = req.body;

        //validate input
        const inputValidation = validateInput(
          [
            // customerName,
            // customerPhone,
            // customerAddress,
            // customerBillingAddress,
            // customerEmail,
            // customerCity,
            // invoiceNumber,
            // paymentMethod,
            billingFirstName,
            billingLastName,
            // billingCompany,
            // billingCountry,
            billingEmail,
            // billingPhone ,
            // address,
            // apartment,
            // city,
            // state,
            // postalCode,
          ],
          [
            // "Name",
            // "Phone",
            // "Shipping Address",
            // "Billing Address",
            // "Email",
            // "City",
            // "Invoice",
            // "Payment Method",
            "Billing First Name",
            "Billing Last Name",
            // "Billing Company",
            // "Billing Country",
            "Billing Email",
            // "Billing Phone",
            // "Address",
            // "Apartment",
            // "City",
            // "State",
            // "Postal Code",
          ]
        );

        if (inputValidation) {
          return res
            .status(400)
            .json(jsonResponse(false, inputValidation, null));
        }

        // console.log("SSL");

        //count total items and subtotal price for order and get name,size,prices info
        let totalNumberOfItems = 0;
        let subtotal = 0;
        // let subtotalCost = 0;
        let newOrderItems = [];
        let allProductNames = "";

        if (orderItems && orderItems.length > 0) {
          const orderItemLength = orderItems.length;
          for (let i = 0; i < orderItemLength; i++) {
            //get product and product attribute for getting prices,name,size info
            const product = await tx.product.findFirst({
              where: {
                id: orderItems[i].productId,
                isDeleted: false,
                isActive: true,
              },
            });
            const productAttribute = await tx.productAttribute.findFirst({
              where: { id: orderItems[i].productAttributeId, isDeleted: false },
            });

            if (!product && !productAttribute) {
              return res
                .status(409)
                .json(jsonResponse(false, "Product does not exist", null));
            }

            newOrderItems.push({
              ...orderItems[i],
              name: product.name,
              size: productAttribute.size,
              costPrice: productAttribute.costPrice,
              retailPrice: productAttribute.retailPrice,
              discountPercent: productAttribute.discountPercent,
              discountPrice: productAttribute.discountPrice,
              discountedRetailPrice: productAttribute.discountedRetailPrice,
              totalCostPrice:
                orderItems[i].quantity * productAttribute.costPrice,
              totalPrice:
                orderItems[i].quantity * productAttribute.discountedRetailPrice,
              quantity: orderItems[i].quantity,
            });

            //calculate total number of items
            totalNumberOfItems = totalNumberOfItems + orderItems[i].quantity;

            //calculate discount prices
            let discountPrice =
              productAttribute.retailPrice *
              (productAttribute.discountPercent / 100);
            let discountedRetailPrice =
              (productAttribute.retailPrice - discountPrice) *
              orderItems[i].quantity;

            //calculate subtotal and subtotal cost price
            // subtotal = subtotal + discountedRetailPrice;
            // subtotal = subtotal + orderItems[i]?.totalPrice;
            // subtotalCost = subtotalCost + orderItems[i]?.totalCostPrice;
            // const itemTotal =
            //   orderItems[i].quantity * productAttribute.discountedRetailPrice;
            // const itemCost =
            //   orderItems[i].quantity * productAttribute.costPrice;

            // subtotal += itemTotal;
            // subtotalCost += itemCost;

            // subtotalCost =
            //   subtotalCost + orderItems[i].quantity * productAttribute.costPrice;

            allProductNames = allProductNames + ", " + orderItems[i]?.name;
          }
        } else {
          return res
            .status(404)
            .json(jsonResponse(false, "Please select at least 1 item", null));
        }

        //get coupon
        let coupon = await tx.coupon.findFirst({
          where: { id: couponId, isActive: true },
        });

        const invoiceHtml = `
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: auto; padding: 20px; border: 1px solid #ddd;">
    <h2 style="text-align: center; color: #192533;">🧾 Invoice</h2>
    
    <p>Dear <strong>${billingFirstName} ${billingLastName}</strong>,</p>
    <p>Your order has been placed successfully!</p>

    <h3 style="margin-top: 30px; color: #192533;">Order Information:</h3>
    <table style="width: 100%; margin-bottom: 20px;">
      <tr><td><strong>Phone:</strong></td><td>${billingPhone}</td></tr>
      <tr><td><strong>Shipping Address:</strong></td><td>${address}</td></tr>
      <tr><td><strong>Billing Address:</strong></td><td>${address}</td></tr>
      <tr><td><strong>City:</strong></td><td>${city}</td></tr>
      <tr><td><strong>Postal Code:</strong></td><td>${postalCode}</td></tr>
      <tr><td><strong>Total Items:</strong></td><td>${totalNumberOfItems}</td></tr>
      <tr><td><strong>Order Status:</strong></td><td>Delivered</td></tr>
    </table>

    <h3 style="color: #192533;">Order Summary:</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ccc; padding: 8px; text-align: left;">Product</th>
          <th style="border: 1px solid #ccc; padding: 8px;">Price</th>
          <th style="border: 1px solid #ccc; padding: 8px;">Quantity</th>
          <th style="border: 1px solid #ccc; padding: 8px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${newOrderItems
          ?.map(
            (orderItm) => `
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">${
                orderItm.name
              } (${orderItm.size})</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${orderItm.costPrice.toFixed(
                2
              )} $</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${
                orderItm.quantity
              }</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${orderItm.totalCostPrice.toFixed(
                2
              )} $</td>
            </tr>
          `
          )
          .join("")}
        <tr>
          <td colspan="3" style="text-align: right; padding: 8px;"><strong>Coupon Discount:</strong></td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${
            coupon?.discountAmount ?? 0
          } $</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right; padding: 8px;"><strong>Subtotal:</strong></td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;"><strong>${subtotalCost.toFixed(
            2
          )} $</strong></td>
        </tr>
      </tbody>
    </table>

    <p style="margin-top: 30px;">Thank you for shopping with us! 💚</p>
  </div>
`;

        //create order
        let newOrder = await tx.order.create({
          data: {
            user: {
              connect: { id: userId },
            },
            couponId, // ensure this variable is defined or null
            invoiceNumber, // ensure this variable is defined or null
            billingFirstName,
            billingLastName,
            billingCompany,
            billingCountry,
            billingEmail,
            billingPhone,
            address,
            apartment,
            city,
            state,
            postalCode,
            invoiceHtml,
            totalItems: totalNumberOfItems,
            subtotalCost: subtotalCost,
            subtotal: subtotal,
            orderItems: {
              create: orderItems.map((item) => ({
                name: item.name,
                size: item.size,
                costPrice: item.costPrice,
                retailPrice: item.retailPrice,
                discountedRetailPrice:
                  item.discountedRetailPrice || item.retailPrice,
                quantity: item.quantity,
                totalCostPrice: item.costPrice * item.quantity,
                totalPrice: item.retailPrice * item.quantity,
                product: {
                  connect: { id: item.productId },
                },
                productAttribute: {
                  connect: { id: item.productAttributeId },
                },
              })),
            },
          },
        });

        // const user = await tx.user.findUnique({
        //   where: { id: userId },
        //   select: {
        //     credits: true,
        //     creditsUsed: true,
        //   },
        // });

        // if (!user || (user.credits ?? 0) <= (user.creditsUsed ?? 0)) {
        //   return res.status(400).json({ error: "No available credits" });
        // }

        // // Update creditsUsed
        // await tx.user.update({
        //   where: { id: userId },
        //   data: {
        //     creditsUsed: { increment: 1 },
        //     credits: { decrement: 1 }, // Decrement credits by 1
        //   },
        // });

        // =====================
        // License certificate ar download url create korar code ekhane add korbe
        // =====================

        // Filter bundle orders (e.g., productId like "bundle-10")
        // const bundleItems = newOrderItems.filter(item =>
        //   item.productId.startsWith("bundle-")
        // );

        // // Add credits for each bundle
        // for (const bundle of bundleItems) {
        //   const creditsToAdd = parseInt(bundle.licenseType); // "10" from "10 Mockups"
        //   if (!isNaN(creditsToAdd)) {
        //     await tx.user.update({
        //       where: { id: userId },
        //       data: {
        //         credits: { increment: creditsToAdd }
        //       }
        //     });
        //   }
        // }

        const licenseTexts = {
          "Personal Use License": (
            buyerName,
            orderNumber,
            date,
            productTitle
          ) => `
MockShark License Certificate

License Type: Personal Use License
Buyer Name: ${buyerName}
Order Number: ${orderNumber}
Download Date: ${date}
Product: ${productTitle}

Usage Rights:
✓ Personal projects (non-commercial)
✓ Portfolio or educational use
✘ Cannot be used in client work
✘ Cannot be resold or redistributed
✘ No use in paid advertising, branding, or merchandising

Issued by: MockShark.com
Support: support@mockshark.com
`,

          "Commercial License": (
            buyerName,
            orderNumber,
            date,
            productTitle
          ) => `
MockShark License Certificate

License Type: Commercial License
Buyer Name: ${buyerName}
Order Number: ${orderNumber}
Download Date: ${date}
Product: ${productTitle}

Usage Rights:
✓ Client work, branding, websites, social media ads
✓ Unlimited commercial projects
✘ Cannot resell or redistribute the mockup file
✘ Cannot include in products where mockup is the main value

Issued by: MockShark.com
Support: support@mockshark.com
`,

          "Extended Commercial License": (
            buyerName,
            orderNumber,
            date,
            productTitle
          ) => `
MockShark License Certificate

License Type: Extended Commercial License
Buyer Name: ${buyerName}
Order Number: ${orderNumber}
Download Date: ${date}
Product: ${productTitle}

Usage Rights:
✓ All commercial rights included
✓ Print-on-demand & resale allowed
✓ Can be used in end-products for sale
✘ Cannot redistribute or resell the raw mockup file

Issued by: MockShark.com
Support: support@mockshark.com
`,

          // Extra aliases (frontend jodi Commercial/Extended Commercial dei)
          Commercial: (...args) => licenseTexts["Commercial License"](...args),
          "Extended Commercial": (...args) =>
            licenseTexts["Extended Commercial License"](...args),
        };

        // newOrderItems er moddhe jodi licenseType thake taile seta nibe, na hole default "Personal Use License" dhore nibe
        for (const item of newOrderItems) {
          const licenseType = item.licenseType || "Personal Use License";
          const templateFn =
            licenseTexts[licenseType] || licenseTexts["Personal Use License"];
          const licenseText = templateFn(
            billingFirstName + " " + billingLastName,
            newOrder.invoiceNumber,
            new Date().toLocaleDateString(),
            item.name
          );

          // LicenseCertificate record create koro
          await tx.licenseCertificate.create({
            data: {
              userId,
              orderId: newOrder.id,
              productId: item.productId,
              licenseType,
              licenseText,
            },
          });

          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product?.downloadUrl) {
            await tx.downloadUrl.create({
              data: {
                userId,
                productId: item.productId,
                orderId: newOrder.id,
                downloadUrl: product.downloadUrl,
              },
            });
          }
        }

        if (!newOrder) {
          return res
            .status(200)
            .json(jsonResponse(false, `Order cannot be placed`, null));
        }
        // for (let i = 0; i < newOrderItems.length; i++) {
        //   const product = await tx.product.findFirst({
        //     where: {
        //       id: newOrderItems[i].productId,
        //       isDeleted: false,
        //       isActive: true,
        //     },
        //   });

        //   if (!product?.downloadUrl) continue;

        //   try {
        //     await tx.downloadUrl.create({
        //       data: {
        //         userId,
        //         productId: newOrderItems[i].productId,
        //         orderId: newOrder.id,
        //         downloadUrl: product.downloadUrl,
        //       },
        //     });
        //     console.log("DownloadUrl created");
        //   } catch (err) {
        //     console.error("Failed to insert download url:", err);
        //   }
        // }

        //reduce stock amount
        for (let i = 0; i < orderItems.length; i++) {
          await tx.productAttribute.update({
            where: { id: orderItems[i].productAttributeId },
            data: {
              stockAmount: { decrement: orderItems[i].quantity },
            },
          });
        }

        console.log("ORDER CHECK");

        // <tr>
        //             <td></td>
        //             <td></td>
        //             <td><b>Discount: </b></td>
        //             <td>${subtotal + deliveryChargeInside - subtotal} TK</td>
        //           </tr>

        //send email invoice
        const emailGenerate = await sendEmail(
          billingEmail,
          `Order Invoice `,
          `<p>Dear ${billingFirstName},</p>

          <p>Your order has been placed successfully!</p>

          <p><b>Order Information:</b></p>
          <p><b>Phone:</b> ${billingPhone}</p>
          <p><b>Shipping Address:</b> ${address}</p>
          <p><b>Billing Address:</b> ${address}</p>
          <p><b>City:</b> ${city}</p>
          <p><b>Postal Code:</b> ${postalCode}</p>
          
          <p><b>Total Items:</b> ${totalNumberOfItems}</p>
          <p><b>Order Status:</b> Delivered</p>
          <br/>
          <table border="1">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
             <tbody>
        ${newOrderItems
          ?.map(
            (orderItm) => `
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">${
                orderItm.name
              } (${orderItm.size})</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${orderItm.costPrice.toFixed(
                2
              )} $</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${
                orderItm.quantity
              }</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${orderItm.totalCostPrice.toFixed(
                2
              )} $</td>
            </tr>
          `
          )
          .join("")}
        <tr>
          <td colspan="3" style="text-align: right; padding: 8px;"><strong>Coupon Discount:</strong></td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${
            coupon?.discountAmount ?? 0
          } $</td>
        </tr>
        <tr>
          <td colspan="3" style="text-align: right; padding: 8px;"><strong>Subtotal:</strong></td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: right;"><strong>${subtotalCost.toFixed(
            2
          )} $</strong></td>
        </tr>
      </tbody>
    </table>
          </table>

          <br/><br/>
          <p>Thank you for shopping. </p>
        `
        );

        return res
          .status(200)
          .json(
            jsonResponse(
              true,
              "Order has been placed successfully! We have sent an invoice to your mail. Thank you.",
              newOrder
            )
          );
      },
      {
        maxWait: 10000, // optional
        timeout: 15000, // increase timeout to 15 seconds
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//create order ssl
export const createOrderSsl = async (req, res) => {
  const {
    userId,
    couponId,
    customerName,
    customerPhone,
    customerAddress,
    customerBillingAddress,
    customerEmail,
    customerCity,
    customerPostalCode,
    invoiceNumber,
    paymentMethod,
    deliveryChargeInside,
    deliveryChargeOutside,
    // totalItems,
    // subtotalCost,
    // subtotal,
    orderItems,
  } = req.body;

  //count total items and subtotal price for order and get name,size,prices info
  let totalNumberOfItems = 0;
  let subtotal = 0;
  let subtotalCost = 0;
  let newOrderItems = [];
  let allProductNames = "";

  if (orderItems && orderItems.length > 0) {
    const orderItemLength = orderItems.length;
    for (let i = 0; i < orderItemLength; i++) {
      //get product and product attribute for getting prices,name,size info
      const product = await prisma.product.findFirst({
        where: {
          id: orderItems[i].productId,
          isDeleted: false,
          isActive: true,
        },
      });
      const productAttribute = await prisma.productAttribute.findFirst({
        where: { id: orderItems[i].productAttributeId, isDeleted: false },
      });

      if (!product && !productAttribute) {
        return res
          .status(409)
          .json(jsonResponse(false, "Product does not exist", null));
      }

      newOrderItems.push({
        ...orderItems[i],
        name: product.name,
        size: productAttribute.size,
        costPrice: productAttribute.costPrice,
        retailPrice: productAttribute.retailPrice,
        discountPercent: productAttribute.discountPercent,
        discountPrice: productAttribute.discountPrice,
        discountedRetailPrice: productAttribute.discountedRetailPrice,
        totalCostPrice: orderItems[i].quantity * productAttribute.costPrice,
        totalPrice:
          orderItems[i].quantity * productAttribute.discountedRetailPrice,
        quantity: orderItems[i].quantity,
      });

      //calculate total number of items
      totalNumberOfItems = totalNumberOfItems + orderItems[i].quantity;

      //calculate discount prices
      let discountPrice =
        productAttribute.retailPrice * (productAttribute.discountPercent / 100);
      let discountedRetailPrice =
        (productAttribute.retailPrice - discountPrice) * orderItems[i].quantity;

      //calculate subtotal and subtotal cost price
      subtotal = subtotal + orderItems[i]?.totalPrice;
      subtotalCost = subtotalCost + orderItems[i]?.totalCostPrice;
      // subtotal = subtotal + discountedRetailPrice;
      // subtotalCost =
      //   subtotalCost + orderItems[i].quantity * productAttribute.costPrice;

      allProductNames = allProductNames + ", " + orderItems[i]?.name;
    }
  } else {
    return res
      .status(404)
      .json(jsonResponse(false, "Please select at least 1 item", null));
  }

  //get coupon
  let coupon = await prisma.coupon.findFirst({
    where: { id: couponId, isActive: true },
  });

  //ssl commerz
  if (paymentMethod?.toLowerCase() === "digital payment") {
    const data = {
      total_amount:
        subtotal + deliveryChargeInside - (coupon?.discountAmount ?? 0),
      currency: "BDT",
      tran_id: invoiceNumber, // use unique tran_id for each api call
      // success_url: "http://localhost:4000/api/v1/orders-success",
      // fail_url: "http://localhost:4000/api/v1/orders-fail",
      // cancel_url: "http://localhost:4000/api/v1/orders-fail",
      success_url: "https://voltech-core.vercel.app/api/v1/orders-success",
      fail_url: "https://voltech-core.vercel.app/api/v1/orders-fail",
      cancel_url: "https://voltech-core.vercel.app/api/v1/orders-fail",
      ipn_url: "http://localhost:3000/ipn/",
      shipping_method: "Courier",
      product_name: allProductNames,
      product_category: "Product",
      product_profile: "general",
      cus_name: customerName,
      cus_email: customerEmail,
      cus_add1: customerBillingAddress,
      cus_add2: "",
      cus_city: customerCity,
      cus_state: customerCity,
      cus_postcode: customerPostalCode,
      cus_country: "Bangladesh",
      cus_phone: customerPhone,
      cus_fax: "",
      ship_name: customerName,
      ship_add1: customerAddress,
      ship_add2: "",
      ship_city: customerCity,
      ship_state: customerCity,
      ship_postcode: Number(customerPostalCode),
      ship_country: "Bangladesh",
    };
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    await sslcz.init(data).then((apiResponse) => {
      console.log("Full API Response:", apiResponse); // Debugging API response

      if (!apiResponse || !apiResponse.GatewayPageURL) {
        return res.status(400).json(
          jsonResponse(false, "Failed to get Gateway URL", {
            error: apiResponse,
          })
        );
      }

      let GatewayPageURL = apiResponse.GatewayPageURL;
      console.log("Redirecting to:", GatewayPageURL);

      // ✅ Ensure only ONE response is sent
      if (!res.headersSent) {
        return res.status(200).json(
          jsonResponse(true, "Redirecting to SSL COMMERZ.", {
            gateway: GatewayPageURL,
          })
        );
      }
    });
    // return;
  }
};

export const createOrderSuccess = async (req, res) => {
  // console.log({ req });
  // res.redirect("http://localhost:3000/checkout?isSuccess=true");
  res.redirect("https://voltech-commerce.vercel.app/checkout?isSuccess=true");
};

export const createOrderFail = async (req, res) => {
  // console.log({ res });
  // res.redirect("http://localhost:3000/checkout?isSuccess=false");
  res.redirect("https://voltech-commerce.vercel.app/checkout?isSuccess=false");
};

//get orders ssl
export const getOrdersSsl = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//get all orders
export const getOrders = async (req, res) => {
  if (req.user?.roleName !== "super-admin") {
    getOrdersByUser(req, res);
  } else {
    try {
      const orders = await prisma.order.findMany({
        where: {
          isDeleted: false,
          // AND: [
          //   {
          //     customerName: {
          //       contains: req.query.customer_name,
          //       mode: "insensitive",
          //     },
          //   },
          //   {
          //     customerPhone: {
          //       contains: req.query.customer_phone,
          //       mode: "insensitive",
          //     },
          //   },
          //   {
          //     customerAddress: {
          //       contains: req.query.customer_address,
          //       mode: "insensitive",
          //     },
          //   },
          //   {
          //     customerCity: {
          //       contains: req.query.customer_city,
          //       mode: "insensitive",
          //     },
          //   },
          //   {
          //     customerPostalCode: {
          //       contains: req.query.customer_postal_code,
          //       mode: "insensitive",
          //     },
          //   },
          //   {
          //     invoiceNumber: {
          //       contains: req.query.invoice_number,
          //       mode: "insensitive",
          //     },
          //   },
          //   {
          //     paymentMethod: {
          //       contains: req.query.payment_method,
          //       mode: "insensitive",
          //     },
          //   },
          //   {
          //     status: {
          //       contains: req.query.status,
          //       mode: "insensitive",
          //     },
          //   },
          // ],
        },
        include: {
          orderItems: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip:
          req.query.limit && req.query.page
            ? parseInt(req.query.limit * (req.query.page - 1))
            : parseInt(defaultLimit() * (defaultPage() - 1)),
        take: req.query.limit
          ? parseInt(req.query.limit)
          : parseInt(defaultLimit()),
      });

      if (orders.length === 0)
        return res
          .status(200)
          .json(jsonResponse(true, "No order is available", null));

      if (orders) {
        return res
          .status(200)
          .json(jsonResponse(true, `${orders.length} orders found`, orders));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Something went wrong. Try again", null));
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json(jsonResponse(false, error, null));
    }
  }
};

//get all orders by user
export const getOrdersByUser = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.params.id,
        isDeleted: false,
        // AND: [
        //   {
        //     customerName: {
        //       contains: req.query.customer_name,
        //       mode: "insensitive",
        //     },
        //   },
        //   {
        //     customerPhone: {
        //       contains: req.query.customer_phone,
        //       mode: "insensitive",
        //     },
        //   },
        //   {
        //     customerAddress: {
        //       contains: req.query.customer_address,
        //       mode: "insensitive",
        //     },
        //   },
        //   {
        //     customerCity: {
        //       contains: req.query.customer_city,
        //       mode: "insensitive",
        //     },
        //   },
        //   {
        //     customerPostalCode: {
        //       contains: req.query.customer_postal_code,
        //       mode: "insensitive",
        //     },
        //   },
        //   {
        //     invoiceNumber: {
        //       contains: req.query.invoice_number,
        //       mode: "insensitive",
        //     },
        //   },
        //   {
        //     paymentMethod: {
        //       contains: req.query.payment_method,
        //       mode: "insensitive",
        //     },
        //   },
        //   {
        //     status: {
        //       contains: req.query.status,
        //       mode: "insensitive",
        //     },
        //   },
        // ],
      },
      include: {
        orderItems: true,
      },

      orderBy: {
        createdAt: "desc",
      },
      skip:
        req.query.limit && req.query.page
          ? parseInt(req.query.limit * (req.query.page - 1))
          : parseInt(defaultLimit() * (defaultPage() - 1)),
      take: req.query.limit
        ? parseInt(req.query.limit)
        : parseInt(defaultLimit()),
    });

    if (orders.length === 0)
      return res
        .status(200)
        .json(jsonResponse(true, "No order is available", null));

    if (orders) {
      return res
        .status(200)
        .json(jsonResponse(true, `${orders.length} orders found`, orders));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "Something went wrong. Try again", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//get single order
export const getOrder = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, isDeleted: false },
      include: {
        orderItems: true,
      },
    });

    if (order) {
      return res.status(200).json(jsonResponse(true, `1 order found`, order));
    } else {
      return res
        .status(404)
        .json(jsonResponse(false, "No order is available", null));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//update order status
export const updateOrder = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const { status } = req.body;

      const orderItems = await tx.orderItem.findMany({
        where: { orderId: req.params.id },
      });

      const orderItemsLength = orderItems.length;

      const getOrder = await tx.order.findFirst({
        where: { id: req.params.id },
      });

      //update order status
      let order;
      if (orderItems && orderItemsLength > 0) {
        order = await tx.order.update({
          where: { id: req.params.id },
          data: {
            status,
          },
        });

        if (order) {
          //stock amount reduction calculation
          // if (order.status === "DELIVERED") {
          //   for (let i = 0; i < orderItemsLength; i++) {
          //     const productAttribute = await tx.productAttribute.update({
          //       where: { id: orderItems[i].productAttributeId },
          //       data: {
          //         stockAmount: { decrement: orderItems[i].quantity },
          //       },
          //     });
          //   }
          // }

          if (order.status === "CANCELED" || order.status === "RETURNED") {
            for (let i = 0; i < orderItemsLength; i++) {
              const productAttribute = await tx.productAttribute.update({
                where: { id: orderItems[i].productAttributeId },
                data: {
                  stockAmount: { increment: orderItems[i].quantity },
                },
              });
            }
          }
        }
      }

      if (order && orderItemsLength > 0) {
        //send email invoice
        let orderStatus = "SHIPPED";
        if (order?.status === "CANCELED") {
          orderStatus = "CANCELED";
        }
        if (order?.status === "RETURNED") {
          orderStatus = "RETURNED";
        }
        if (order?.status === "DELIVERED") {
          orderStatus = "DELIVERED";
        }
        const emailGenerate = await sendEmail(
          order?.customerEmail,
          `Order Status Updated For Invoice #${order?.invoiceNumber}`,
          `<p>Dear ${order?.customerName},</p>

          <p>Your order has been ${orderStatus}!</p>

          <p><b>Order Information:</b></p>
          <p><b>Phone:</b> ${order?.customerPhone}</p>
          <p><b>Shipping Address:</b> ${order?.customerAddress}</p>
          <p><b>Billing Address:</b> ${order?.customerBillingAddress}</p>
          <p><b>City:</b> ${order?.customerCity}</p>
          <p><b>Postal Code:</b> ${order?.customerPostalCode}</p>
          <p><b>Payment Method:</b> ${order?.paymentMethod}</p>
          <p><b>Total Items:</b> ${order?.totalItems}</p>
          <p><b>Order Status:</b> ${status}</p>
          <br/>
          <table border="1">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems?.map(
                (orderItm) =>
                  `<tr>
                  <td>
                    ${orderItm?.name} (${orderItm?.size})
                  </td>
                  <td>${orderItm?.discountedRetailPrice} $</td>
                  <td>${orderItm?.quantity}</td>
                  <td>${orderItm?.totalPrice} $</td>
                </tr>`
              )}
                <tr>
                  <td></td>
                  <td></td>
                  <td><b>Coupon Discount: </b></td>
                  <td>${coupon?.discountAmount ?? 0} $</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td><b>Delivery Charge: </b></td>
                  <td>${order?.deliveryChargeInside ?? 0} $</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td><b>Subtotal: </b></td>
                  <td><b>${order?.subtotal} $</b></td>
                </tr>
            </tbody>
          </table>

          <br/><br/>
          <p>Thank you for shopping.</p>
        `
        );

        return res
          .status(200)
          .json(jsonResponse(true, `Order status has been updated`, order));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Order status has not been updated", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

//delete order
export const deleteOrder = async (req, res) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: req.params.id },
        data: { isDeleted: true },
      });

      if (order) {
        return res
          .status(200)
          .json(jsonResponse(true, `Order has been deleted`, order));
      } else {
        return res
          .status(404)
          .json(jsonResponse(false, "Order has not been deleted", null));
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(jsonResponse(false, error, null));
  }
};

// controllers/download/getDownloads.js
export const getUserDownloads = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Step 1: Get all downloads
    const downloads = await prisma.downloadUrl.findMany({
      where: { userId },
    });

    // Step 2: Extract productIds safely (remove null/undefined)
    const productIds = downloads
      .map((d) => d.productId)
      .filter((id) => typeof id === "string" && id.trim() !== "");

    // Step 3: Fetch all products in a single query
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: { id: true, name: true },
    });

    // Step 4: Map product names to downloads
    const productMap = products.reduce((acc, product) => {
      acc[product.id] = product.name;
      return acc;
    }, {});

    const downloadsWithProduct = downloads.map((item) => ({
      ...item,
      productName: productMap[item.productId] ?? "Unknown Product",
    }));

    return res.status(200).json({
      success: true,
      message: "Downloads fetched successfully",
      data: downloadsWithProduct,
    });
  } catch (error) {
    console.error("Download fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const getUserLicenses = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Missing userId in query.",
    });
  }

  try {
    const licenses = await prisma.licenseCertificate.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = licenses.map((item) => ({
      productName: item.product?.name || "Unknown Product",
      licenseType: item.licenseType,
      licenseText: item.licenseText,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("License fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// POST a new bundle
export const createBundle = async (req, res) => {
  try {
    const { title, price, regularPrice, discountPrice, mockups, paddleProductId, paddlePriceId } = req.body;

    if (!title || !price || !regularPrice || !mockups) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newBundle = await prisma.bundle.create({
      data: {
        title,
        price: parseFloat(price),
        regularPrice: parseFloat(regularPrice),
        discountPrice: parseFloat(discountPrice),
        mockups: parseInt(mockups),
        paddleProductId: paddleProductId, 
        paddlePriceId: paddlePriceId
      },
    });

    return res.status(201).json({
      success: true,
      message: "Bundle created successfully",
      data: newBundle,
    });
  } catch (error) {
    console.error("POST /v1/bundles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create bundle",
      error: error.message,
    });
  }
};

export const updateBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, regularPrice, discountPrice, mockups, paddleProductId, paddlePriceId } = req.body;

    console.log('inside update  bundle');

    if (!title || !price || !regularPrice || !mockups) {
      console.log("Missing fields:", { title, price, regularPrice, mockups });
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const updatedBundle = await prisma.bundle.update({
      where: { id },
      data: {
        title,
        price: parseFloat(price),
        regularPrice: parseFloat(regularPrice),
        discountPrice: parseFloat(discountPrice),
        mockups: parseInt(mockups),
        paddleProductId: paddleProductId, 
        paddlePriceId: paddlePriceId
      },
    });

    return res.status(200).json({
      success: true,
      message: "Bundle updated successfully",
      data: updatedBundle,
    });
  } catch (error) {
    console.error("PUT /v1/bundles/:id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update bundle",
      error: error.message,
    });
  }
};

export const getBundles = async (req, res) => {
  try {
    const bundles = await prisma.bundle.findMany({
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({
      success: true,
      message: "Bundles fetched successfully",
      data: bundles,
    });
  } catch (error) {
    console.error("GET /v1/bundles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bundles",
      error: error.message,
    });
  }
};
export const deleteBundle = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.bundle.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Bundle deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("DELETE /v1/bundle/:id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete bundle",
      error: error.message,
    });
  }
};

export const downloadWithCredit = async (req, res) => {
  const { userId, productId } = req.query;

  if (!userId || !productId) {
    return res.status(400).json({
      success: false,
      message: "User ID and Product ID are required",
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!user || !product) {
    return res.status(404).json({
      success: false,
      message: "User or Product not found",
    });
  }

  const remaining = user.credits - user.creditsUsed;
  if (remaining <= 0) {
    return res.status(403).json({
      success: false,
      message: "No credits left",
    });
  }

  // Generate unique order number for each download
  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Update user's used credit
  await prisma.user.update({
    where: { id: userId },
    data: { creditsUsed: { increment: 1 } },
  });

  const licenseText = `
MockShark License Certificate

License Type: Commercial License
Buyer Name: ${user.name}
Order Number: ${orderId}
Download Date: ${new Date().toLocaleDateString()}
Product: ${product.name}

Usage Rights:
✓ Client work, branding, websites, social media ads
✓ Unlimited commercial projects
✘ Cannot resell or redistribute the mockup file
✘ Cannot include in products where mockup is the main value

Issued by: MockShark.com
Support: support@mockshark.com
  `.trim();

  // Save license with unique orderId
  await prisma.licenseCertificate.create({
    data: {
      userId,
      productId,
      // orderId, // store this in DB (add it to your schema)
      licenseType: "Commercial License",
      licenseText,
    },
  });

  // Store download URL (you can keep it for record/log)
  await prisma.downloadUrl.create({
    data: {
      userId,
      productId,
      downloadUrl: product.downloadUrl,
    },
  });

  return res.status(200).json({
    success: true,
    message: "Product Purchased",
    downloadUrl: product.downloadUrl,
    // orderId, // send it back for frontend license identification
  });
};

export const createBundleOrder = async (req, res) => {
  try {
    const {
      userId,
      invoiceNumber,
      billingFirstName,
      billingLastName,
      billingEmail,
      billingPhone,
      address,
      city,
      postalCode,
      bundleId,
      credits,
      price,
    } = req.body;

    if (
      !userId ||
      !bundleId ||
      !credits ||
      !price ||
      !billingFirstName ||
      !billingLastName ||
      !billingEmail
      // billingPhone, address, city, postalCode are optional here
    ) {
      return res
        .status(400)
        .json(jsonResponse(false, "Missing required fields", null));
    }

    return await prisma.$transaction(async (tx) => {
      const invoiceHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: auto; padding: 20px; border: 1px solid #ddd;">
          <h2 style="text-align: center; color: #192533;">🧾 Invoice</h2>
          <p>Dear <strong>${billingFirstName} ${billingLastName}</strong>,</p>
          <p>Your bundle order has been placed successfully!</p>

          <h3 style="margin-top: 30px; color: #192533;">Order Info:</h3>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr><td><strong>Invoice #:</strong></td><td>${invoiceNumber}</td></tr>
            <tr><td><strong>Phone:</strong></td><td>${
              billingPhone || "-"
            }</td></tr>
            <tr><td><strong>Address:</strong></td><td>${address || "-"}, ${
        city || "-"
      }, ${postalCode || "-"}</td></tr>
            <tr><td><strong>Credits:</strong></td><td>${credits}</td></tr>
            <tr><td><strong>Total:</strong></td><td>$${price}</td></tr>
          </table>

          <p style="margin-top: 30px;">Thanks for shopping with MockShark 💚</p>
        </div>
      `;

      const orderItem = {
        name: `${credits} Mockups Bundle`,
        quantity: 1,
        size: `${credits} Credits`,
        totalPrice: price,
        retailPrice: price,
        costPrice: price,
        discountedRetailPrice: price,
        totalCostPrice: price,
      };

      // 1. Create Bundle Order with nested order item, connect user relation explicitly
      const newBundleOrder = await tx.bundleOrder.create({
        data: {
          user: { connect: { id: userId } },
          invoiceNumber,
          billingFirstName,
          billingLastName,
          billingEmail,
          billingPhone: billingPhone ?? "",
          address: address ?? "",
          city: city ?? "",
          postalCode: postalCode ?? "",
          subtotal: price,
          totalItems: 1,
          invoiceHtml,
          orderItems: {
            create: [orderItem],
          },
        },

        include: { orderItems: true },
      });

      // 2. Create License Certificate, connect user & bundleOrder relations explicitly
      await tx.licenseCertificate.create({
        data: {
          user: { connect: { id: userId } },
          bundleOrder: { connect: { id: newBundleOrder.id } },
          licenseType: "Commercial License",
          licenseText: `You purchased ${credits} credits with bundle #${bundleId}`,
        },
      });

      // 3. Update User Credits
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: credits,
          },
        },
      });

      return res.status(200).json(
        jsonResponse(true, "Bundle order placed successfully", {
          ...newBundleOrder,
          invoiceHtml,
        })
      );
    });
  } catch (error) {
    console.error("❌ Bundle Order Error:", error);
    return res.status(500).json(jsonResponse(false, error.message, null));
  }
};

// export const createBundleOrder = async (req, res) => {
//   const {
//     userId,
//     name,
//     price,
//     credits,
//     quantity,
//     variant,
//     isBundle,
//   } = req.body;

//   if (!userId || !name || !price || !credits || !quantity || !variant) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   try {
//     const bundleOrder = await prisma.bundleOrder.create({
//       data: {
//         user: { connect: { id: userId } },
//         name,
//         price: parseFloat(price),
//         credits: parseInt(credits),
//         usedCredits: 0, // ensure tracking starts at 0
//         quantity: parseInt(quantity),
//         variant,
//         isBundle: isBundle ?? true, // default to true if not passed
//       },
//     });

//     res.status(201).json({
//       status: "success",
//       data: bundleOrder,
//     });
//   } catch (error) {
//     console.error("❌ Bundle order creation error:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// controllers/bundleOrderController.js
export const getBundleOrdersByUser = async (req, res) => {
  const { id } = req.params;

  try {
    const orders = await prisma.bundleOrder.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching bundle orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bundle orders",
    });
  }
};

export const getSingleBundleOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.userId;

  try {
    const order = await prisma.bundleOrder.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        orderItems: true,
        licenseCertificates: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Bundle order not found or access denied",
      });
    }

    console.log("✅ Found bundle order:", order);

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: {
        id: order.id,
        invoiceNumber:
          order.invoiceNumber || order.id.slice(0, 8).toUpperCase(),
        date: order.createdAt,
        total: order.subtotal,
        invoiceHtml: order.invoiceHtml || null, // ✅ this line must not be missing
      },
    });
  } catch (error) {
    console.error("Error fetching bundle order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ✅ Paddle Checkout V2 Integration

export const createOrderPaddle = async (req, res) => {
  const {
    userId,
    couponId,
    customerName,
    customerPhone,
    customerAddress,
    customerBillingAddress,
    customerEmail,
    customerCity,
    customerPostalCode,
    invoiceNumber,
    deliveryChargeInside,
    paymentMethod,
    orderItems,
  } = req.body;

  console.log("Received order payload:", req.body);

  let totalNumberOfItems = 0;
  let subtotal = 0;
  let subtotalCost = 0;
  let newOrderItems = [];
  let allProductNames = "";

  if (orderItems && orderItems.length > 0) {
    for (let item of orderItems) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, isDeleted: false, isActive: true },
      });

      const attribute = await prisma.productAttribute.findFirst({
        where: { id: item.productAttributeId, isDeleted: false },
      });

      if (!product || !attribute) {
        console.log("❌ Invalid product or attribute");
        return res
          .status(404)
          .json({ success: false, message: "Invalid product" });
      }

      const totalPrice = item.quantity * attribute.discountedRetailPrice;
      const totalCostPrice = item.quantity * attribute.costPrice;

      subtotal += totalPrice;
      subtotalCost += totalCostPrice;
      totalNumberOfItems += item.quantity;

      newOrderItems.push({
        ...item,
        name: product.name,
        size: attribute.size,
        totalPrice,
        totalCostPrice,
      });

      allProductNames += `, ${product.name}`;
    }
  } else {
    console.log("❌ No items provided in order");
    return res
      .status(400)
      .json({ success: false, message: "No items in order" });
  }

  let coupon = null;
  if (couponId) {
    coupon = await prisma.coupon.findFirst({
      where: { id: couponId, isActive: true },
    });
    if (coupon) {
      console.log(
        "✅ Coupon applied:",
        coupon.code,
        "-",
        coupon.discountAmount
      );
    }
  }

  const totalAmount =
    subtotal + (deliveryChargeInside || 0) - (coupon?.discountAmount || 0);

  // ✅ Paddle V2 API
  const API_KEY = process.env.PADDLE_API_KEY; // apikey_xxxxx
  const PADDLE_API_URL = "https://api.paddle.com/checkout/sessions";

  try {
    const paddleRes = await axios.post(
      PADDLE_API_URL,
      {
        customer: {
          email: customerEmail,
        },
        items: orderItems.map((item) => ({
          price_id: "pri_01jwvht6kpem6y9vjz0qerpvbv", // This must be created in Paddle dashboard manually
          quantity: item.quantity || 1,
        })),
        custom_data: {
          userId,
          invoiceNumber,
        },
        success_url: `http://localhost:3000/success`,
        cancel_url: `http://localhost:3000/cancel`,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const checkoutUrl = paddleRes.data?.data?.url;
    console.log("✅ Paddle Checkout URL:", checkoutUrl);

    if (!checkoutUrl) {
      console.log("❌ Paddle response missing checkout URL");
      return res.status(400).json({
        success: false,
        message: "Failed to generate Paddle checkout link",
        error: paddleRes.data,
      });
    }

    return res.status(200).json({
      success: true,
      gateway: checkoutUrl,
    });
  } catch (error) {
    console.error("❌ Paddle error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Paddle checkout failed",
      error: error.response?.data || error.message,
    });
  }
};

export const handlePaddleWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log("✅ Paddle Webhook Event:", event);

    const eventType = event.event_type; // like "payment_succeeded", "checkout_completed"
    const customData = event.data?.custom_data || {};

    const userId = customData.userId;
    const invoiceNumber = customData.invoiceNumber;

    if (eventType === "payment_succeeded") {
      // ✅ Update order status in DB
      await prisma.order.updateMany({
        where: {
          userId,
          invoiceNumber,
          status: "pending",
        },
        data: {
          status: "paid",
          paymentReference: event.data.id,
        },
      });

      console.log("✅ Order marked as paid for:", invoiceNumber);
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("❌ Paddle Webhook Error:", err);
    res.status(500).send("Webhook processing failed");
  }
};
