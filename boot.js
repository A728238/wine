// boot.js
(async function initBoxedWine() {
    // 1. ユーザー名とリポジトリ名を設定
    const USERNAME = "ユーザー名";
    const REPO = "リポジトリ名";
    const baseURL = `https://${USERNAME}.github.io/${REPO}`;

    // 2. CSSの動的読み込み
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = `${baseURL}/SingleThreaded/boxedwine.css`;
    document.head.appendChild(cssLink);

    // 3. 分割ZIPファイルの順次取得と結合
    console.log("[BoxedWine] 分割アーカイブの取得を開始します...");

    // 分割ファイルの指定 (バッチ処理で生成されるファイル名に準拠)
    // 47MBの場合、part001, part002, part003 の3つが生成されます
    const partFiles = [
        `${baseURL}/Wine11/boxedwine.zip.part001`,
        `${baseURL}/Wine11/boxedwine.zip.part002`,
        `${baseURL}/Wine11/boxedwine.zip.part003`
    ];

    try {
        // 並列ダウンロード
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

        // ArrayBufferを結合して1つのBlobを作成
        console.log("[BoxedWine] 分割ファイルを結合中...");
        const mergedZipBlob = new Blob(responses, { type: "application/zip" });
        const zipBlobURL = URL.createObjectURL(mergedZipBlob);

        console.log("[BoxedWine] 結合完了。Blob URLを準備しました:", zipBlobURL);

        // 4. Configの設定 (結合したBlob URLを設定)
        window.Config = {
            locateFile: (path) => `${baseURL}/SingleThreaded/${path}`,
            urlParams: "",
            appZip: zipBlobURL,
            arguments: ["/bin/sh", "/root/run.sh"]
        };

        // 5. BoxedWine スクリプトの動的ロード
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