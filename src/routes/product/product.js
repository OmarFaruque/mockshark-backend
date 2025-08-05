import express from "express";
import multer from "multer";
import {
  banProduct,
  createBlog,
  createProduct,
  createProductAttribute,
  createProductImage,
  deleteBlog,
  deleteProduct,
  deleteProductAttribute,
  deleteProductImage,
  getAllBlogs,
  getBlogById,
  getFeaturedProductsForCustomer,
  getProduct,
  getProductAttributes,
  getProductForCustomer,
  getProductImages,
  getProducts,
  getProductsByUser,
  getProductsForCustomer,
  getTrendingProductsForCustomer,
  increaseProductViewCount,
  sendProductEmail,
  updateBlog,
  updateProduct,
  updateProductAttribute,
  updateProductImage,
} from "../../controllers/product/product.js";
import {
  productBan,
  productCreate,
  productEdit,
  productList,
  productRemove,
  productSingle,
  productUserList,
} from "../../utils/modules.js";
import verify from "../../utils/verifyToken.js";

// const upload = multer({ dest: "public/images/product" });
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post(
  "/v1/products",
  // verify,
  upload.array("images"),
  createProduct
);
router.get("/v1/products-email/:id", verify, sendProductEmail);
router.get("/v1/products",   getProducts);
router.get("/v1/user/products/", productUserList, verify, getProductsByUser);
router.get("/v1/products/:slug", productSingle, verify, getProduct);

router.put(
  "/v1/products/:id",

  verify,
  upload.array("images"),
  updateProduct
);

router.put("/v1/products/attributes/:id", verify, updateProductAttribute);
router.put(
  "/v1/products/images/:id",
  
  verify,
  upload.single("image"),
  updateProductImage
);

router.put("/v1/products/:id/viewCount", increaseProductViewCount);
router.put("/v1/products/:id/ban", productBan, verify, banProduct);
router.delete(
  "/v1/products/images/:id",
 
  verify,
  deleteProductImage
);
router.delete("/v1/products/:id", verify, deleteProduct);

//attributes
router.post("/v1/products-attributes", verify, createProductAttribute);
router.get("/v1/products-attributes/:id", verify, getProductAttributes);
router.put("/v1/products-attributes/:id", verify, updateProductAttribute);
router.delete("/v1/products-attributes/:id", verify, deleteProductAttribute);

//images
router.get("/v1/products-images/:id", verify, getProductImages);
router.post(
  "/v1/products-images",
  verify,
  upload.single("image"),
  createProductImage
);
router.delete("/v1/products-images/:id", verify, deleteProductImage);

// For Customer
router.get("/v1/customer/products", getProductsForCustomer);
router.get("/v1/customer/products/:id", getProductForCustomer);
router.get("/v1/customer/trending-products", getTrendingProductsForCustomer);
router.get("/v1/customer/featured-products", getFeaturedProductsForCustomer);


router.post("/v1/create-blog", upload.single('image'), createBlog);
router.put("/v1/blogs/:id", upload.single("image"), updateBlog);
router.delete("/v1/blogs/:id", deleteBlog);

// Get All Blogs
router.get("/v1/blogs", getAllBlogs);

// Get Single Blog
router.get("/v1/blogs/:id", getBlogById);



export default router;
