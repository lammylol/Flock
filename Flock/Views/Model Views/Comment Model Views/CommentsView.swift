// CommentsView.swift
// Flock
//
// provides the UI for viewing and adding comments
//
// Created by Ramon Jiang 09/011/24

import SwiftUI
import Observation

struct CommentsView: View {
    let post: Post
    var isInSheet: Bool
    var viewModel: CommentViewModel
    
    @State private var newCommentText = ""
    @FocusState private var isCommentFieldFocused: Bool
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            commentsList
            errorView
            commentInputField
        }
        .onChange(of: newCommentText) {
            viewModel.scrollToEnd = true
        }
    }

    private func fetchCommentsIfNeeded() async {
        guard !post.id.isEmpty else {
            print("PostID is empty, not fetching comments")
            return
        }
        await viewModel.fetchInitialComments()  // Removed the post parameter
    }
    
    private var commentsList: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView()
            } else if viewModel.comments.isEmpty {
                VStack {
                    Text("No comments yet. Be the first to comment!")
                        .foregroundColor(.secondary)
                        .font(.system(size: 14))
                }
            } else {
                VStack (alignment: .leading) {
                    ForEach(viewModel.comments) { comment in
                        CommentRow(comment: comment, currentUserID: userHolder.person.userID) {
                            Task {
                                await deleteComment(comment)
                            }
                        }
                    }
                    
                    if viewModel.hasMoreComments {
                        fetchMoreCommentsView()
                    }
                }
            }
        }
    }
    
    private func fetchMoreCommentsView() -> some View {
        VStack (alignment: .leading) {
            if viewModel.isLoadingMore {
                ProgressView()
            } else {
                Button {
                    Task {
                        await viewModel.fetchMoreComments()
                    }
                } label: {
                    Text("Load more comments")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                }                .disabled(!viewModel.hasMoreComments)
                .padding(.vertical, 5)
            }
        }
    }
    
    private var errorView: some View {
        Group {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .padding(.horizontal)
            }
        }
    }
    
    private var commentInputField: some View {
        HStack(alignment: .top) {
            ZStack(alignment: .leading) {
                TextEditor(text: $newCommentText)
                    .frame(minHeight: 35)
                    .frame(maxWidth: .infinity)
                    .font(.system(size: 16))
                    .padding(.leading, 5)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray, lineWidth: 0.5)
                    )
                    .background(Color.clear)
                    .cornerRadius(8)
                    .focused($isCommentFieldFocused)
                
                if newCommentText.isEmpty {
                    Text("Add a comment...")
                        .foregroundColor(.gray)
                        .padding(.leading, 10)
                        .font(.system(size: 14))
                        .allowsHitTesting(false)
                }
            }
            
            if !newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button { Task { await postComment() } }
                label: {
                    tagModelView(textLabel: "Post", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
                }
                .disabled(isCommentTextEmpty)
                .padding(.leading, 1)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var isCommentTextEmpty: Bool {
        newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func postComment() async {
        guard !isCommentTextEmpty else { return }
        
        do {
            try await viewModel.addComment(text: newCommentText)
            newCommentText = ""
            isCommentFieldFocused = false
        } catch {
            print("Error posting comment: \(error)")
            viewModel.errorMessage = "Failed to post comment: \(error.localizedDescription)"
        }
    }
    
    private func deleteComment(_ comment: Comment) async {
        if let commentID = comment.id {
            await viewModel.deleteComment(commentID: commentID)
        }
    }
}

struct CommentRow: View {
    let comment: Comment
    let currentUserID: String
    var onDelete: () -> Void

    @State private var showDeleteConfirmation = false
    
    var body: some View {
        HStack {
            HStack (alignment: .top) {
                ProfilePictureAvatar(firstName: comment.firstName, lastName: comment.lastName, imageSize: 35, fontSize: 16)
                VStack (alignment: .leading, spacing: 7) {
                    HStack (spacing: 5) {
                        Text((comment.firstName + " " + comment.lastName)
                            .capitalized)
                            .fontWeight(.bold)
                            .font(.system(size: 14))
                        Text(PostHelper().relativeTimeStringAbbrev(for: comment.createdAt))
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                    }
                    Text(comment.text)
                        .font(.system(size: 16))
                }
                Spacer()
            }
            Spacer()
            if comment.userID == currentUserID {
                Menu {
                    Button(role: .destructive) {
                        showDeleteConfirmation = true
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis")
                        .rotationEffect(.degrees(90))
                        .foregroundColor(.gray.opacity(0.6))
                        .font(.system(size: 14))
                        .padding(8)
                }
                .highPriorityGesture(TapGesture())
            }
        }
        .confirmationDialog(
            "Confirm delete?",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive, action: onDelete)
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This action cannot be undone.")
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.vertical, 5)
    }
}
