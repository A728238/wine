// boot.js
(async function initBoxedWine() {
    const USERNAME = "a728238";
    const REPO = "wine";
    const baseURL = `https://${USERNAME}.github.io/${REPO}`;

    // 1. about:blank 上に UI / Canvas 画面要素を動的生成
    if (!document.getElementById("canvas")) {
        // UI スタイル適用
        document.body.style.backgroundColor = "#000";
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";

        // メインコンテナ
        const container = document.createElement("div");
        container.id = "boxedwine-container";
        container.style.cssText = "width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center;";

        // BoxedWine が描画に使用する Canvas
        const canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.style.cssText = "width: 100%; height: 100%; object-fit: contain;";
        
        // Contextmenu（右クリックメニュー）の誤動作を防止
        canvas.oncontextmenu = (e) => e.preventDefault();

        container.appendChild(canvas);
        document.body.appendChild(container);
    }

    // 2. CSSの動的読み込み
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `${baseURL}/SingleThreaded/boxedwine.css`;
    document.head.appendChild(cssLink);

    // 3. 分割ZIPファイルの取得と結合
    console.log("[BoxedWine] 分割アーカイブの取得を開始します...");

    const partFiles = [
        `${baseURL}/Wine11/boxedwine.zip.part001`,
        `${baseURL}/Wine11/boxedwine.zip.part002`,
        `${baseURL}/Wine11/boxedwine.zip.part003`
    ];

    try {
        const responses = await Promise.all(
            partFiles.map(async (url) => {
                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`ファイルの取得に失敗しました: ${url} (HTTP Status: ${res.status})`);
                }
                console.log(`[Loaded] ${url}`);
                return res.arrayBuffer();
            })
        );

        console.log("[BoxedWine] 分割ファイルを結合中...");
        const mergedZipBlob = new Blob(responses, { type: "application/zip" });
        const zipBlobURL = URL.createObjectURL(mergedZipBlob);

        console.log("[BoxedWine] 結合完了。Blob URLを準備しました:", zipBlobURL);

        // 4. Config の設定（Canvas 要素の参照設定を含む）
        window.Config = {
            locateFile: (path) => `${baseURL}/SingleThreaded/${path}`,
            urlParams: "",
            appZip: zipBlobURL,
            arguments: ["/bin/sh", "/root/run.sh"],
            canvas: document.getElementById("canvas")
        };

        // 5. スクリプトの動的ロード
        const loadScript = (src) => new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });

        await loadScript(`${baseURL}/SingleThreaded/boxedwine-shell.js`);
        await loadScript(`${baseURL}/SingleThreaded/boxedwine.js`);

        console.log("[BoxedWine] 正常に起動シーケンスが完了しました。");

    } catch (err) {
        console.error("[BoxedWine ERROR]", err);
    }
})();
