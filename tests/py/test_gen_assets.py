import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "tools"))
import gen_assets  # noqa: E402


def touch(root, rel, content=b"x"):
    p = os.path.join(root, *rel.split("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f:
        f.write(content)


class GenAssetsTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        for rel in ["index.html", "manifest.webmanifest", "assets.js", "css/styles.css", "js/main.js", "js/views/a.js",
                    "data/tour.json", "fonts/a.woff2", "icons/icon-192.png", "img/a-160.webp", "img/a-900.webp",
                    "video/v.mp4", "tools/serve.py", "tests/x.js", "img/.DS_Store"]:
            touch(self.root, rel)

    def test_lists(self):
        a = gen_assets.build(self.root)
        self.assertEqual(a["app"]["files"][:2], ["./", "./index.html"])
        self.assertIn("./assets.js", a["app"]["files"])
        self.assertIn("./js/views/a.js", a["app"]["files"])
        self.assertNotIn("./tools/serve.py", a["app"]["files"])
        self.assertEqual(a["media"]["files"], ["./img/a-160.webp", "./img/a-900.webp", "./video/v.mp4"])

    def test_version_follows_content_and_media_is_separate(self):
        a1 = gen_assets.build(self.root)
        touch(self.root, "data/tour.json", b"changed")
        a2 = gen_assets.build(self.root)
        self.assertNotEqual(a1["app"]["version"], a2["app"]["version"])
        self.assertEqual(a1["media"]["version"], a2["media"]["version"])

    def test_assets_js_content_does_not_affect_version(self):
        a1 = gen_assets.build(self.root)
        touch(self.root, "assets.js", b"self.ASSETS = {}")
        self.assertEqual(a1["app"]["version"], gen_assets.build(self.root)["app"]["version"])


if __name__ == "__main__":
    unittest.main()
