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

    def read_sw(self):
        with open(os.path.join(self.root, "sw.js"), encoding="utf-8", newline="") as f:
            return f.read()

    def test_stamp_sw_prepends_then_replaces_first_line(self):
        touch(self.root, "sw.js", b"/* sw */\nconsole.log(1);\n")
        a = gen_assets.build(self.root)
        gen_assets.stamp_sw(self.root, a)
        want = f"// version: {a['app']['version']}-{a['media']['version']}"
        self.assertEqual(self.read_sw(), want + "\n/* sw */\nconsole.log(1);\n")
        touch(self.root, "data/tour.json", b"changed")
        a2 = gen_assets.build(self.root)
        gen_assets.stamp_sw(self.root, a2)
        want2 = f"// version: {a2['app']['version']}-{a2['media']['version']}"
        self.assertNotEqual(want, want2)
        self.assertEqual(self.read_sw(), want2 + "\n/* sw */\nconsole.log(1);\n")

    def test_stamp_sw_creates_missing_file_and_is_idempotent(self):
        a = gen_assets.build(self.root)
        gen_assets.stamp_sw(self.root, a)
        once = self.read_sw()
        self.assertTrue(once.startswith("// version: "))
        gen_assets.stamp_sw(self.root, a)
        self.assertEqual(self.read_sw(), once)

    def test_sw_js_is_not_in_the_lists(self):
        touch(self.root, "sw.js")
        a = gen_assets.build(self.root)
        self.assertNotIn("./sw.js", a["app"]["files"])


if __name__ == "__main__":
    unittest.main()
