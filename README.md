# Website quản lý đảng viên - Chi bộ Sinh viên 6

Ứng dụng web tĩnh dùng HTML/CSS/JavaScript để quản lý danh sách đảng viên cho **Chi bộ Sinh viên 6**.

## Tính năng

- Đăng nhập với 3 vai trò:
  - **Đảng**: toàn quyền xem/thêm/sửa/xóa.
  - **Chi ủy**: xem/thêm/sửa.
  - **Đảng viên**: chỉ xem và tìm kiếm.
- Quản lý hồ sơ đảng viên (thêm, cập nhật, xóa theo phân quyền).
- Tìm kiếm nhanh theo họ tên, chi bộ, trạng thái, chức vụ.
- Lưu danh sách đảng viên và phiên đăng nhập vào `localStorage`.

## Tài khoản demo

- `dang_admin / 123456` (Đảng)
- `chiuy_01 / 123456` (Chi ủy)
- `dangvien_01 / 123456` (Đảng viên)

## Chạy thử

Mở trực tiếp file `index.html` trong trình duyệt hoặc chạy một static server:

```bash
python3 -m http.server 4173
```

Sau đó truy cập `http://localhost:4173`.
