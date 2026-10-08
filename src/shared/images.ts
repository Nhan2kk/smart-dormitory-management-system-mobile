import type { ImageSource } from "expo-image";
import type { WallpaperName } from "./theme";

/**
 * Ảnh thật từ Unsplash (giấy phép Unsplash, dùng miễn phí). Ảnh tải qua CDN theo kích thước cần dùng;
 * ảnh nội bộ `dormitory-hero.png` làm ảnh chờ khi chưa có mạng.
 */
export class Photos {
  private static url(id: string, width: number): ImageSource {
    return { uri: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=${width}` };
  }

  static readonly placeholder = require("../../assets/dormitory-hero.png");

  /** Ảnh màn chào do người dùng chọn (nguồn: CafeF). */
  static welcome(): ImageSource {
    return { uri: "https://cafefcdn.com/2020/3/25/db4c1279-1585103343848695628731.jpg" };
  }

  /** KTX ĐHQG TP.HCM (Dĩ An) — ảnh Phong Nguyen. */
  static dormVietnam(width = 1080) {
    return Photos.url("1600787163038-1687eecc5d54", width);
  }

  /** Tòa ký túc xá lúc chạng vạng, cửa sổ sáng đèn — ảnh chính Trang chủ. */
  static dormDusk(width = 1080) {
    return Photos.url("1763770449161-eb1cd5596415", width);
  }

  /** Sảnh lớn với đèn chùm vàng, sàn đá bóng — ảnh nền Trang chủ. */
  static grandLobby(width = 1080) {
    return Photos.url("1677129667171-92abd8740fa3", width);
  }

  /** Sảnh đá cẩm thạch, quầy lễ tân hiện đại. */
  static marbleLobby(width = 1080) {
    return Photos.url("1758448656987-cfae6bf225e4", width);
  }

  /** Sảnh sàn đá, trần gỗ ấm. */
  static warmLobby(width = 1080) {
    return Photos.url("1768270181430-3e3672a32283", width);
  }

  /** Khuôn viên trường lúc hoàng hôn. */
  static campusSunset(width = 1080) {
    return Photos.url("1583373834259-46cc92173cb7", width);
  }

  /** Phòng ký túc xá nhiều giường tầng. */
  static bunkRoom(width = 1080) {
    return Photos.url("1709805619372-40de3f158e83", width);
  }

  /** Giường tầng kim loại cạnh cửa sổ. */
  static bunkBed(width = 1080) {
    return Photos.url("1555854877-bab0e564b8d5", width);
  }

  /** Góc học tập trong phòng. */
  static studyDesk(width = 800) {
    return Photos.url("1674162406360-df5ec5eb97e4", width);
  }

  /** Phòng ngủ sáng sủa có bàn học. */
  static brightRoom(width = 800) {
    return Photos.url("1632119289059-793dd347950f", width);
  }

  /** Ảnh đại diện cho từng tòa nhà. */
  static building(id: string, width = 600) {
    const map: Record<string, string> = {
      A: "1600787163038-1687eecc5d54",
      B: "1619626463900-e342c2f2a94e",
      C: "1596276020587-8044fe049813",
      D: "1562774053-701939374585",
    };
    return Photos.url(map[id] ?? map.A, width);
  }

  /** Ảnh nền cho chế độ kính trong suốt. */
  static wallpaper(name: WallpaperName, width = 900) {
    return { lobby: Photos.grandLobby, campus: Photos.campusSunset, dorm: Photos.dormVietnam, room: Photos.bunkRoom }[name](width);
  }
}
