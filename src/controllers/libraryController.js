import Playlist from "../model/playlist";
import Song from "../model/song";
import path from "path";

export const createPlaylist = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized",
        data: null
      });
    }

    const { title, description, imgUrl, isPublic } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({
        statusCode: 400,
        message: "title is required",
        data: null
      });
    }

    let baseTitle = title.trim();

    // Auto-append suffix (n) if duplicate title for this user
    let finalTitle = baseTitle;
    const exists = await Playlist.findOne({ user: userId, title: finalTitle, isDeleted: false });
    if (exists) {
      let n = 1;
      // increment until unique
      // Note: findOne each loop to keep logic simple and robust
      // Example: "My Playlist (1)", "My Playlist (2)"...
      // Users can rename later
      // Guard upper bound to avoid infinite loops
      while (n < 1000) {
        const candidate = `${baseTitle} (${n})`;
        const dup = await Playlist.findOne({ user: userId, title: candidate, isDeleted: false });
        if (!dup) {
          finalTitle = candidate;
          break;
        }
        n++;
      }
    }

    const payload = {
      title: finalTitle,
      user: userId,
      isPublic: typeof isPublic === "boolean" ? isPublic : true,
    };

    if (typeof description === "string" && description.trim()) {
      payload.description = description.trim();
    }

    if (typeof imgUrl === "string" && imgUrl.trim()) {
      payload.imgUrl = imgUrl.trim();
    }

    const playlist = await Playlist.create(payload);

    return res.status(201).json({
      statusCode: 201,
      message: "Playlist created",
      data: playlist,
    });
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      message: err.message,
      data: null
    });
  }
};

export const getPlaylistTracks = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized",
        data: null
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        statusCode: 400,
        message: "playlist id is required",
        data: null
      });
    }

    const playlist = await Playlist.findById(id)
      .populate({ path: "tracks.track", model: Song });

    if (!playlist || playlist.isDeleted) {
      return res.status(404).json({
        statusCode: 404,
        message: "Playlist not found",
        data: null
      });
    }

    // Access control: owner can always view; public playlists visible to anyone authenticated
    if (!playlist.isPublic && String(playlist.user) !== String(userId)) {
      return res.status(403).json({
        statusCode: 403,
        message: "Forbidden",
        data: null
      });
    }

    const songs = (playlist.tracks || [])
      .map(t => t?.track)
      .filter(Boolean)
      .map(s => ({
        id: s._id,
        title: s.title,
        imgUrl: s.imgUrl,
      }));

    return res.status(200).json({
      statusCode: 200,
      message: "Get playlist tracks success",
      data: {
        playlist: { id: playlist._id, title: playlist.title },
        songs,
      }
    });
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      message: err.message,
      data: null
    });
  }
};

export const updatePlaylistCover = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized",
        data: null,
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        statusCode: 400,
        message: "playlist id is required",
        data: null,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        statusCode: 400,
        message: "Missing cover file",
        data: null,
      });
    }

    const playlist = await Playlist.findById(id);
    if (!playlist || playlist.isDeleted) {
      return res.status(404).json({
        statusCode: 404,
        message: "Playlist not found",
        data: null,
      });
    }

    // Only owner can update cover
    if (String(playlist.user) !== String(userId)) {
      return res.status(403).json({
        statusCode: 403,
        message: "Forbidden",
        data: null,
      });
    }

    // Public URL for the uploaded cover under /uploads
    const imgPath = `/uploads/playlistcovers/${req.file.filename}`;

    playlist.imgUrl = imgPath;
    await playlist.save();

    return res.status(200).json({
      statusCode: 200,
      message: "Playlist cover updated",
      data: playlist,
    });
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      message: err.message,
      data: null,
    });
  }
};

export const updatePlaylist = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ statusCode: 400, message: "playlist id is required", data: null });
    }
    const playlist = await Playlist.findById(id);
    if (!playlist || playlist.isDeleted) {
      return res.status(404).json({ statusCode: 404, message: "Playlist not found", data: null });
    }
    if (String(playlist.user) !== String(userId)) {
      return res.status(403).json({ statusCode: 403, message: "Forbidden", data: null });
    }
    const { title, description, isPublic } = req.body || {};
    if (typeof title === 'string') playlist.title = title.trim();
    if (typeof description === 'string') playlist.description = description.trim();
    if (typeof isPublic === 'boolean') playlist.isPublic = isPublic;
    await playlist.save();
    return res.status(200).json({ statusCode: 200, message: "Playlist updated", data: playlist });
  } catch (err) {
    return res.status(500).json({ statusCode: 500, message: err.message, data: null });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ statusCode: 400, message: "playlist id is required", data: null });
    }
    const playlist = await Playlist.findById(id);
    if (!playlist || playlist.isDeleted) {
      return res.status(404).json({ statusCode: 404, message: "Playlist not found", data: null });
    }
    if (String(playlist.user) !== String(userId)) {
      return res.status(403).json({ statusCode: 403, message: "Forbidden", data: null });
    }
    playlist.isDeleted = true;
    await playlist.save();
    return res.status(200).json({ statusCode: 200, message: "Playlist deleted", data: { id } });
  } catch (err) {
    return res.status(500).json({ statusCode: 500, message: err.message, data: null });
  }
};

// Add a track to a playlist
export const addTrackToPlaylist = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ statusCode: 401, message: "Unauthorized", data: null });
    }

    const { id } = req.params; // playlist id
    const { trackId } = req.body || {};

    if (!id || !trackId) {
      return res.status(400).json({ statusCode: 400, message: "playlist id and trackId are required", data: null });
    }

    const playlist = await Playlist.findById(id);
    if (!playlist || playlist.isDeleted) {
      return res.status(404).json({ statusCode: 404, message: "Playlist not found", data: null });
    }

    // Only owner can add tracks
    if (String(playlist.user) !== String(userId)) {
      return res.status(403).json({ statusCode: 403, message: "Forbidden", data: null });
    }

    const song = await Song.findById(trackId);
    if (!song) {
      return res.status(404).json({ statusCode: 404, message: "Song not found", data: null });
    }

    // Check duplicate
    const exists = (playlist.tracks || []).some(t => String(t.track) === String(trackId));
    if (exists) {
      return res.status(200).json({ statusCode: 200, message: "Track already in playlist", data: playlist });
    }

    playlist.tracks.push({ track: trackId, addedAt: new Date() });
    await playlist.save();

    return res.status(200).json({ statusCode: 200, message: "Track added", data: playlist });
  } catch (err) {
    return res.status(500).json({ statusCode: 500, message: err.message, data: null });
  }
};
